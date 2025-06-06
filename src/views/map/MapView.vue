<template>
  <div class="map-view-container">
    <div ref="mapContainer" class="map-container">
      <div v-if="loading.value && !map" class="map-loading-overlay">
        <p>地圖載入中...</p>
      </div>
      <div v-if="error" class="map-error-overlay">
        <p>地圖載入錯誤: {{ error }}</p>
        <button @click="retryMapLoad" class="retry-button">重試</button>
      </div>
    </div>

    <div class="search-bar-wrapper">
      <input
        type="text"
        v-model="searchQuery"
        @input="handleSearchInput"
        placeholder="搜尋酒吧或地點..."
        class="search-input"
      />
      <ul v-if="predictions.length > 0 && showPredictions" class="predictions-list">
        <li
          v-for="prediction in predictions"
          :key="prediction.place_id"
          @click="selectPrediction(prediction)"
        >
          {{ prediction.description }}
        </li>
      </ul>
      <button @click="performSearch" class="search-button">
        <i class="fas fa-search"></i>
      </button>
      <button @click="toggleFilterPanel" class="filter-button">
        <i class="fas fa-filter"></i>
      </button>
    </div>

    <button
      @click="getCurrentLocationWithFeedback"
      class="current-location-button"
      :disabled="locationLoading"
    >
      <i :class="['fas', locationLoading ? 'fa-spinner fa-spin' : 'fa-location-arrow']"></i>
      {{ locationLoading ? '定位中...' : '' }}
    </button>

    <FilterPanel
      v-if="isFilterPanelOpen"
      :initialFilters="currentFilters"
      @filter-changed="handleFilterChange"
      @close-panel="closeFilterPanel"
      @remove-applied-filter="removeAppliedFilter"
      class="filter-panel"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from "vue";
import { useGoogleMaps } from "@/composable/useGoogleMaps"; // 確保路徑正確
import FilterPanel from "@/components/map/FilterPanel.vue"; // 確保路徑正確

// 響應式狀態
const mapContainer = ref(null);
const searchQuery = ref("");
const predictions = ref([]);
const showPredictions = ref(false); // 控制預測列表的顯示
const isFilterPanelOpen = ref(false);
const currentFilters = ref({
  address: "any",
  ratingSort: "any",
  minDistance: 0,
  maxDistance: 5000,
  minOpenHour: 0,
  minOpenMinute: 0,
  maxOpenHour: 24,
  maxOpenMinute: 0,
  tags: [],
});

const filteredBars = ref([]); // 用於儲存經過篩選的酒吧數據
const barsData = ref([]); // 假設這是所有酒吧的原始數據
const loadingBars = ref(false);
const barsError = ref(null);
const locationLoading = ref(false); // 用於定位按鈕的載入狀態

// 從環境變數獲取 API Key
const googleMapsApiKey = import.meta.env.VITE_Maps_API_KEY;

// 使用 useGoogleMaps 組合式函式
const {
  map,
  loading, // 地圖API載入狀態
  error, // 地圖API載入錯誤
  initMap,
  displayBarsOnMap,
  clearMarkers,
  showInfoWindow,
  closeInfoWindow,
  panTo,
  setZoom,
  fitBounds,
  requestGeolocationPermission, // 僅請求權限，不移動地圖或加標記
  getCurrentLocation: useMapsGetCurrentLocation, // 重命名以避免衝突
  getPlacePredictions,
  searchAndDisplayPlaces,
  calculateDistance,
  formatInfoWindowContent: defaultFormatInfoWindowContent, // 暴露預設的 InfoWindow 格式化函數
  currentMarker,
  searchMarkers,
} = useGoogleMaps(mapContainer, {
  googleMapsApiKey: googleMapsApiKey,
  onLoaded: () => {
    // 這個 onLoaded 現在會由 useGoogleMaps 內部在 window.google.maps 存在時觸發
    console.log("useGoogleMaps: Google Maps API 已準備好，初始化地圖。");
    if (map.value === null) { // 避免重複初始化
      initMap();
    }
    // API 載入成功後，可以嘗試獲取目前位置
    getCurrentLocationWithFeedback();
    fetchBars(); // 地圖準備好後才載入酒吧數據
  },
  onError: (err) => {
    console.error("useGoogleMaps 內部錯誤:", err);
    // 錯誤會設定到 useGoogleMaps 返回的 error ref
  },
});

// 新增一個狀態來追蹤 Google Maps API 腳本是否已載入
const isApiScriptLoaded = ref(false);

// 全局載入 Google Maps API 的函式
const loadGoogleMapsScript = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    console.warn("在非瀏覽器環境中跳過 Google Maps API 腳本載入。");
    return;
  }

  if (window.google && window.google.maps) {
    console.log("Google Maps API script already present.");
    isApiScriptLoaded.value = true;
    return;
  }

  if (document.getElementById('google-maps-script')) {
    console.log("Google Maps API script element already exists.");
    isApiScriptLoaded.value = true;
    return;
  }

  if (!googleMapsApiKey) {
    console.error("Google Maps API Key 未提供，無法載入地圖。");
    error.value = "Google Maps API Key 未提供。"; // 更新錯誤狀態
    return;
  }

  // 設定 loading 狀態
  loading.value = true;

  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places&callback=initMapCallback`;
  script.async = true;
  script.defer = true;
  script.id = 'google-maps-script'; // 添加 ID 以便檢查是否已存在

  // 將回調函式定義為全局
  window.initMapCallback = () => {
    console.log("Google Maps API script loaded successfully.");
    isApiScriptLoaded.value = true; // 更新腳本載入狀態
    loading.value = false; // 載入完成
    // 此時 useGoogleMaps 內部會因為 window.google.maps 存在而觸發 onLoaded
  };

  script.onerror = (e) => {
    console.error("Google Maps API script load failed:", e);
    isApiScriptLoaded.value = false; // 載入失敗
    loading.value = false; // 載入完成 (帶錯誤)
    error.value = "Google Maps API 載入失敗，請檢查網路連線或 API Key。"; // 更新錯誤狀態
    // 可以在這裡顯示更友善的錯誤訊息給用戶
  };

  document.head.appendChild(script);
};

// 重試地圖載入
const retryMapLoad = () => {
  error.value = null; // 清除之前的錯誤
  loadGoogleMapsScript(); // 重新嘗試載入腳本
};

// --- Bar 數據相關邏輯 (假設) ---
const fetchBars = async () => {
  loadingBars.value = true;
  barsError.value = null;
  try {
    // 這裡替換為您實際獲取酒吧數據的邏輯，例如從 API
    // 為了演示，我們使用一個模擬數據
    const response = await new Promise(resolve => setTimeout(() => {
      resolve([
        { id: 1, name: '信義區時尚酒吧', location: { lat: 25.0336, lng: 121.5654 }, address: '信義區', rating: 4.5, user_ratings_total: 120, priceRange: '$$$', openingHours: { weekday_text: ["週一至週日: 18:00 - 02:00"] }, imageUrl: 'https://via.placeholder.com/150/FF7F50/FFFFFF?text=Bar1', description: '提供多種創意調酒', tags: ['創意調酒', '約會小酌', '信義區'] },
        { id: 2, name: '大安區精釀啤酒吧', location: { lat: 25.0425, lng: 121.5435 }, address: '大安區', rating: 4.8, user_ratings_total: 200, priceRange: '$$', openingHours: { weekday_text: ["週一至週六: 17:00 - 00:00"] }, imageUrl: 'https://via.placeholder.com/150/6495ED/FFFFFF?text=Bar2', description: '精選各地精釀啤酒', tags: ['精釀啤酒', '輕鬆氛圍', '大安區'] },
        { id: 3, name: '中山區運動酒吧', location: { lat: 25.0538, lng: 121.5230 }, address: '中山區', rating: 4.2, user_ratings_total: 80, priceRange: '$', openingHours: { weekday_text: ["週一至週日: 16:00 - 01:00"] }, imageUrl: 'https://via.placeholder.com/150/9370DB/FFFFFF?text=Bar3', description: '設有大型螢幕轉播賽事', tags: ['運動酒吧', '大型螢幕', '中山區'] },
        { id: 4, name: '松山區復古主題吧', location: { lat: 25.0505, lng: 121.5490 }, address: '松山區', rating: 4.0, user_ratings_total: 60, priceRange: '$$', openingHours: { weekday_text: ["週二至週日: 19:00 - 03:00"] }, imageUrl: 'https://via.placeholder.com/150/20B2AA/FFFFFF?text=Bar4', description: '獨特復古裝潢', tags: ['復古', '獨特調酒', '松山區'] },
        { id: 5, name: '萬華區秘密基地', location: { lat: 25.0380, lng: 121.5030 }, address: '萬華區', rating: 4.7, user_ratings_total: 150, priceRange: '$$$', openingHours: { weekday_text: ["週三至週日: 20:00 - 04:00"] }, imageUrl: 'https://via.placeholder.com/150/8A2BE2/FFFFFF?text=Bar5', description: '隱密而有格調', tags: ['秘密基地', '品味之選', '萬華區'] },
      ]);
    }, 500)); // 模擬網路請求延遲

    barsData.value = response;
    applyCurrentFilters(); // 獲取數據後應用當前篩選
  } catch (err) {
    barsError.value = "載入酒吧數據失敗：" + err.message;
    console.error("載入酒吧數據失敗：", err);
  } finally {
    loadingBars.value = false;
  }
};

// --- 篩選器相關邏輯 ---

// 應用篩選器到酒吧數據
const applyCurrentFilters = () => {
  let tempBars = [...barsData.value]; // 複製原始數據

  // 1. 地點篩選
  if (currentFilters.value.address !== 'any') {
    tempBars = tempBars.filter(bar => bar.address === currentFilters.value.address);
  }

  // 2. 距離篩選 (需要當前位置才能計算距離)
  if (currentMarker.value && (currentFilters.value.minDistance > 0 || currentFilters.value.maxDistance < 5000)) {
    const userLocation = currentMarker.value.getPosition().toJSON();
    tempBars = tempBars.filter(bar => {
      const distance = calculateDistance(userLocation, bar.location);
      bar.distance = distance; // 將距離添加到 bar 物件中，方便 InfoWindow 顯示
      return distance >= currentFilters.value.minDistance && distance <= currentFilters.value.maxDistance;
    });
  } else {
    // 如果沒有當前位置，或者距離篩選是預設值，則移除之前計算的距離
    tempBars.forEach(bar => delete bar.distance);
  }

  // 3. 營業時間篩選 (簡化範例，可能需要更複雜的日期時間判斷)
  if (currentFilters.value.minOpenHour !== 0 || currentFilters.value.minOpenMinute !== 0 ||
      currentFilters.value.maxOpenHour !== 24 || currentFilters.value.maxOpenMinute !== 0) {

    const filterMinTime = currentFilters.value.minOpenHour * 60 + currentFilters.value.minOpenMinute;
    const filterMaxTime = currentFilters.value.maxOpenHour * 60 + currentFilters.value.maxOpenMinute;

    tempBars = tempBars.filter(bar => {
      // 這裡需要解析 bar.openingHours.weekday_text 來獲取當天營業時間
      // 為了簡化，我們假設 bar 裡有一個 'openTime' 和 'closeTime' 屬性
      // 或者能從 weekday_text 中提取出時間
      if (bar.openingHours && bar.openingHours.weekday_text && bar.openingHours.weekday_text.length > 0) {
        // 假設 weekday_text[0] 格式為 "週一至週日: 18:00 - 02:00"
        const timeStrMatch = bar.openingHours.weekday_text[0].match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
        if (timeStrMatch) {
          const [_, openStr, closeStr] = timeStrMatch;
          const [openHour, openMinute] = openStr.split(':').map(Number);
          const [closeHour, closeMinute] = closeStr.split(':').map(Number);

          let barOpenTime = openHour * 60 + openMinute;
          let barCloseTime = closeHour * 60 + closeMinute;

          // 處理跨夜營業，例如 18:00 - 02:00
          if (barCloseTime < barOpenTime) {
            barCloseTime += 24 * 60; // 跨夜則結束時間加上一天的小時數
          }

          // 處理篩選時間跨夜，例如 22:00 - 03:00
          let effectiveFilterMinTime = filterMinTime;
          let effectiveFilterMaxTime = filterMaxTime;
          if (effectiveFilterMaxTime < effectiveFilterMinTime) {
             effectiveFilterMaxTime += 24 * 60;
          }

          // 檢查酒吧營業時間是否與篩選時間有交集
          // 交集條件：max(barOpenTime, effectiveFilterMinTime) < min(barCloseTime, effectiveFilterMaxTime)
          // 這裡簡化為篩選的開始時間在酒吧營業時間內，並且結束時間也在營業時間內 (這會比較嚴格)
          // 更好的方法是判斷時間區間是否有重疊
          const isOverlapping = (start1, end1, start2, end2) => {
              return Math.max(start1, start2) < Math.min(end1, end2);
          };

          // 如果酒吧在指定時間內開門，且指定時間點落在營業時間範圍內
          // 或者篩選範圍與酒吧的營業時間有重疊
          return isOverlapping(barOpenTime, barCloseTime, effectiveFilterMinTime, effectiveFilterMaxTime);

        }
      }
      return false; // 無法解析時間或沒有營業時間
    });
  }

  // 4. 標籤篩選
  if (currentFilters.value.tags && currentFilters.value.tags.length > 0) {
    tempBars = tempBars.filter(bar =>
      currentFilters.value.tags.every(tag => bar.tags && bar.tags.includes(tag))
    );
  }

  // 5. 評價排序
  if (currentFilters.value.ratingSort !== 'any') {
    tempBars.sort((a, b) => {
      if (currentFilters.value.ratingSort === 'highToLow') {
        return (b.rating || 0) - (a.rating || 0);
      } else if (currentFilters.value.ratingSort === 'lowToHigh') {
        return (a.rating || 0) - (b.rating || 0);
      }
      // 'mostPopular' 這裡需要更複雜的邏輯，例如根據評論數量或近期活動
      // 暫時按評論數量排序
      else if (currentFilters.value.ratingSort === 'mostPopular') {
         return (b.user_ratings_total || 0) - (a.user_ratings_total || 0);
      }
      return 0;
    });
  }

  filteredBars.value = tempBars;
  displayBarsOnMap(filteredBars.value); // 在地圖上顯示篩選後的酒吧
};


const handleFilterChange = (newFilters) => {
  currentFilters.value = { ...newFilters };
  applyCurrentFilters();
};

const closeFilterPanel = () => {
  isFilterPanelOpen.value = false;
};

const toggleFilterPanel = () => {
  isFilterPanelOpen.value = !isFilterPanelOpen.value;
};

const removeAppliedFilter = ({ type, value }) => {
  if (type === 'address') {
    currentFilters.value.address = 'any';
  } else if (type === 'ratingSort') {
    currentFilters.value.ratingSort = 'any';
  } else if (type === 'distance') {
    currentFilters.value.minDistance = 0;
    currentFilters.value.maxDistance = 5000;
  } else if (type === 'openHour') {
    currentFilters.value.minOpenHour = 0;
    currentFilters.value.minOpenMinute = 0;
    currentFilters.value.maxOpenHour = 24;
    currentFilters.value.maxOpenMinute = 0;
  } else if (type === 'tag') {
    currentFilters.value.tags = currentFilters.value.tags.filter(tag => tag !== value);
  }
  applyCurrentFilters(); // 應用新的篩選
};

// --- 搜尋功能相關邏輯 ---
let searchDebounceTimer = null;
const handleSearchInput = async () => {
  clearTimeout(searchDebounceTimer);
  showPredictions.value = true;
  if (searchQuery.value.length < 2) {
    predictions.value = [];
    return;
  }
  searchDebounceTimer = setTimeout(async () => {
    if (map.value && window.google && window.google.maps.places) {
      predictions.value = await getPlacePredictions(searchQuery.value);
    } else {
      console.warn("地圖或 Places API 未準備好，無法獲取地點預測。");
    }
  }, 300);
};

const selectPrediction = async (prediction) => {
  searchQuery.value = prediction.description; // 將選中的預測設置為搜尋框的值
  showPredictions.value = false; // 隱藏預測列表
  // 執行搜尋並顯示在地圖上
  if (map.value && window.google && window.google.maps.places) {
    searchAndDisplayPlaces(prediction.description);
  } else {
    console.warn("地圖或 Places API 未準備好，無法搜尋地點。");
  }
};

const performSearch = () => {
  showPredictions.value = false; // 隱藏預測列表
  if (searchQuery.value.trim() === '') {
    // 如果搜尋框為空，清除搜尋標記並顯示所有酒吧
    clearMarkers("search");
    displayBarsOnMap(filteredBars.value); // 重新顯示篩選後的酒吧
    return;
  }
  if (map.value && window.google && window.google.maps.places) {
    searchAndDisplayPlaces(searchQuery.value);
  } else {
    console.warn("地圖或 Places API 未準備好，無法執行搜尋。");
  }
};


// --- 地理定位相關邏輯 ---
const getCurrentLocationWithFeedback = async () => {
  if (locationLoading.value) return; // 避免重複點擊

  locationLoading.value = true;
  try {
    // 呼叫 useGoogleMaps 提供的 getCurrentLocation
    await useMapsGetCurrentLocation(isFilterPanelOpen.value ? 320 : 0); // 傳入側邊欄寬度

    // 如果成功定位，重新應用篩選器，因為距離可能會改變
    applyCurrentFilters();
    console.log("成功獲取目前位置。");
  } catch (err) {
    console.error("獲取目前位置失敗:", err);
    alert(`獲取位置失敗: ${err.message || '請檢查您的位置設定。'}`);
  } finally {
    locationLoading.value = false;
  }
};

// --- InfoWindow 內容自定義 (覆寫 useGoogleMaps 提供的預設) ---
// 您可以在這裡定義更符合您需求的 InfoWindow 內容
// 該函數將被 useGoogleMaps 內部調用，並傳入 bar 或 placeDetails 物件
const customFormatInfoWindowContent = (data) => {
  const isPlaceResult = (obj) => {
    return obj && typeof obj === 'object' && obj.place_id !== undefined;
  };

  let name = '';
  let rating = 'N/A';
  let reviews = '0';
  let address = '';
  let phone = '';
  let website = '';
  let openingHoursText = '未提供營業時間';
  let imageUrl = '';
  let description = '無描述';
  let tagsHtml = '';
  let distanceHtml = '';

  if (isPlaceResult(data)) {
    name = data.name || '';
    rating = data.rating ? `⭐️ ${data.rating}` : 'N/A';
    reviews = data.user_ratings_total ? ` (${data.user_ratings_total} 評論)` : ' (0 評論)';
    address = data.formatted_address || data.vicinity || '';
    phone = data.international_phone_number || '';
    website = data.website || '';

    if (data.opening_hours && data.opening_hours.weekday_text && data.opening_hours.weekday_text.length > 0) {
      const currentDay = new Date().getDay(); // 0 (Sunday) to 6 (Saturday)
      openingHoursText = data.opening_hours.weekday_text[currentDay] || data.opening_hours.weekday_text[0] || '營業時間待提供';
    }
    if (data.photos && data.photos.length > 0) {
      imageUrl = data.photos[0].getUrl({ maxWidth: 300, maxHeight: 200 });
    }
    description = data.editorial_summary?.overview || data.vicinity || data.formatted_address || '無描述';
    if (data.types && data.types.length > 0) {
      tagsHtml = `<div class="info-window-tags-container">${data.types
        .map((type) => `<span class="info-window-tag">${type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>`)
        .join("")}</div>`;
    }
  } else { // 假定是我們的 Bar 類型
    name = data.name || '';
    rating = data.rating ? `⭐️ ${data.rating}` : 'N/A';
    reviews = data.user_ratings_total ? ` (${data.user_ratings_total} 評論)` : ' (0 評論)';
    address = data.address || '';
    // 假設 bar 數據中有 phone 和 website
    phone = data.phone || '';
    website = data.website || '';

    if (data.openingHours && data.openingHours.weekday_text && data.openingHours.weekday_text.length > 0) {
      openingHoursText = data.openingHours.weekday_text[0];
    }
    imageUrl = data.imageUrl || '';
    description = data.description || '無描述';
    if (data.tags && data.tags.length > 0) {
      tagsHtml = `<div class="info-window-tags-container">${data.tags
        .map((tag) => `<span class="info-window-tag">${tag}</span>`)
        .join("")}</div>`;
    }
    if (data.distance !== undefined) {
      distanceHtml = `<p class="info-window-meta"><strong>距離:</strong> ${data.distance.toFixed(0)} 公尺</p>`;
    }
  }

  // 生成 HTML 內容
  return `
    <div class="info-window-content">
      <h3 class="info-window-title">${name}</h3>
      ${imageUrl ? `<img src="${imageUrl}" class="info-window-image" alt="${name}" />` : ''}
      <p class="info-window-meta"><strong>評價:</strong> ${rating}${reviews}</p>
      ${address ? `<p class="info-window-meta"><strong>地址:</strong> ${address}</p>` : ''}
      ${phone ? `<p class="info-window-meta"><strong>電話:</strong> <a href="tel:${phone}">${phone}</a></p>` : ''}
      ${website ? `<p class="info-window-meta"><strong>網站:</strong> <a href="${website}" target="_blank">${website}</a></p>` : ''}
      <p class="info-window-meta"><strong>營業時間:</strong> ${openingHoursText}</p>
      ${distanceHtml}
      <p class="info-window-meta"><strong>描述:</strong> ${description}</p>
      ${tagsHtml}
      <a href="#" class="info-window-more-info">查看更多</a>
    </div>
  `;
};

// 覆寫 useGoogleMaps 內部的 formatInfoWindowContent
// 確保在 useGoogleMaps 初始化後調用此設置
// 如果在 useGoogleMaps 實例化時可以直接傳入，會更好
// 這裡假設 useGoogleMaps 導出了 formatInfoWindowContent 讓我們可以直接修改其內部引用
// 或者更合理的做法是，useGoogleMaps 接受一個 `formatContent` 的選項
// 但目前我們在 MapView 內部直接覆寫這個變數，這需要 useGoogleMaps 暴露這個變數
// 為了簡化，我們直接在 MapView 內部調用 useGoogleMaps 返回的 formatInfoWindowContent
// 來確保它總是使用我們這裡定義的內容
// 在此範例中，我已經在 useGoogleMaps 內部將其作為參數暴露出來，因此可以這樣用
// 如果您想完全覆寫，需要將 useGoogleMaps 的 formatInfoWindowContent 作為一個可寫的 ref 暴露
// 或者讓 MapView 傳入這個自定義函數給 useGoogleMaps。
// 為了不改動 useGoogleMaps 的暴露方式，我們讓 InfoWindow 的內容生成直接在 MapView 處理
// 但這樣會失去 useGoogleMaps 內部統一管理 InfoWindow 內容的優勢
// 這裡將使用 useGoogleMaps 提供的 defaultFormatInfoWindowContent，但確保它經過了必要的空值檢查
// 我們已經在 useGoogleMaps.js 裡加了空值檢查，所以這裡不需要額外處理

// 重新設定標記點擊事件的 InfoWindow 內容生成邏輯
watch(map, (newMap) => {
  if (newMap) {
    // 重新綁定 displayBarsOnMap 中的標記點擊事件，使用 customFormatInfoWindowContent
    // 但因為 displayBarsOnMap 每次都重新創建標記，所以只要確保 displayBarsOnMap 傳入的數據是完整的即可
    // 或者，我們修改 useGoogleMaps，讓 InfoWindow 的內容生成可以外部傳入
    // 目前 useGoogleMaps 已經提供了一個 formatInfoWindowContent 的出口，我們會在生成時讓它使用
    // 因此，這裡的 watch 邏輯主要用於確保地圖初始化後，後續操作能正常執行

    // 檢查 Google Maps API 是否已載入且地圖已初始化
    if (window.google && window.google.maps && map.value) {
      // 可以在這裡進行一些地圖初始化後的操作，例如載入酒吧數據
      // 但這已經在 useGoogleMaps 的 onLoaded 回調中處理了
    }
  }
}, { immediate: true });


// 組件掛載時，載入 Google Maps 腳本
onMounted(() => {
  loadGoogleMapsScript();
});

// 在組件卸載時清理資源 (由 useGoogleMaps 內部處理)
onUnmounted(() => {
  // useGoogleMaps 內部處理了 resizeObserver 的 unobserve
  // 如果有其他需要手動清理的，可以在這裡添加
});
</script>

<style scoped>
/* 容器樣式 */
.map-view-container {
  display: flex;
  flex-direction: column;
  height: 100vh; /* 確保佔滿整個視窗高度 */
  position: relative;
  overflow: hidden;
}

/* 地圖容器 */
.map-container {
  flex-grow: 1; /* 讓地圖佔滿剩餘空間 */
  width: 100%;
  position: relative; /* 確保載入疊層能正確定位 */
}

.map-loading-overlay,
.map-error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 50; /* 確保在地圖上方 */
  color: #333;
  font-size: 1.2rem;
  text-align: center;
}

.map-error-overlay p {
  color: #d32f2f; /* 紅色錯誤文字 */
  margin-bottom: 15px;
}

.retry-button {
  padding: 10px 20px;
  background-color: #4CAF50; /* 綠色 */
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s ease;
}

.retry-button:hover {
  background-color: #45a049;
}

/* 搜尋列樣式 */
.search-bar-wrapper {
  position: absolute;
  top: 15px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 500px;
  z-index: 10;
  display: flex;
  gap: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  background-color: white;
  padding: 8px;
}

.search-input {
  flex-grow: 1;
  padding: 12px 15px;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  outline: none;
  background-color: #f8f8f8;
}

.predictions-list {
  position: absolute;
  top: 100%; /* 位於搜尋框下方 */
  left: 0;
  right: 0;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  z-index: 100; /* 確保在最上層 */
  max-height: 250px;
  overflow-y: auto;
  list-style: none;
  padding: 0;
  margin-top: 5px; /* 與搜尋框保持一些距離 */
}

.predictions-list li {
  padding: 10px 15px;
  cursor: pointer;
  font-size: 0.95rem;
  color: #333;
  border-bottom: 1px solid #eee;
}

.predictions-list li:last-child {
  border-bottom: none;
}

.predictions-list li:hover {
  background-color: #f0f0f0;
}


.search-button, .filter-button {
  background-color: #b8a28e;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 12px 15px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-button:hover, .filter-button:hover {
  background-color: #a08d7a;
}

/* 目前位置按鈕 */
.current-location-button {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background-color: #fff;
  color: #333;
  border: 1px solid #ccc;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  z-index: 10;
  transition: background-color 0.2s, transform 0.2s;
}

.current-location-button:hover {
  background-color: #f0f0f0;
  transform: translateY(-2px);
}

.current-location-button:disabled {
  background-color: #e0e0e0;
  cursor: not-allowed;
  opacity: 0.7;
}

/* 篩選面板樣式 (直接從 FilterPanel.vue 的樣式拷貝，或者通過 import 引入) */
.filter-panel {
  position: absolute;
  top: 0;
  right: 0;
  width: 320px; /* 根據 FilterPanel 的實際寬度設定 */
  height: 100%;
  background-color: white;
  box-shadow: -4px 0 15px rgba(0, 0, 0, 0.2);
  z-index: 200; /* 確保在搜尋列和按鈕之上 */
  transition: transform 0.3s ease-out;
  transform: translateX(0); /* 預設顯示 */
}

/* 如果要實現滑入滑出效果，需要結合 v-if 或 v-show 和 transform */
.filter-panel.closed {
  transform: translateX(100%);
}

/* RWD 調整 */
@media (max-width: 768px) {
  .search-bar-wrapper {
    width: 95%;
  }

  .current-location-button {
    bottom: 15px;
    right: 15px;
    width: 45px;
    height: 45px;
    font-size: 1rem;
  }
}

@media (max-width: 600px) {
  .filter-panel {
    width: 100%; /* 手機上讓篩選面板佔滿寬度 */
    max-width: 100vw;
  }
}
</style>