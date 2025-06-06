<template>
  <div class="map-view-container">
    <div class="top-left-controls">
      <button
        class="filter-toggle-button map-control-button"
        @click="toggleFilterPanel"
      >
        <i class="fas fa-filter"></i>
      </button>

      <div class="search-panel-map">
        <div class="input-group">
          <input
            type="text"
            id="searchInput"
            class="search-input"
            v-model="searchQuery"
            placeholder="輸入地點名稱或關鍵字"
            @input="debouncedSearchSuggestions"
          />
          <ul v-if="suggestions.length" class="suggestions-list">
            <li
              v-for="(suggestion, index) in suggestions"
              :key="index"
              @click="selectSuggestion(suggestion)"
            >
              🔍 {{ suggestion.description }}
            </li>
          </ul>
          <button
            @click="handleSearch"
            class="btn search-bt map-control-button"
          >
            <b>🔍 搜尋</b>
          </button>
        </div>
      </div>

      <button
        @click="handleGetCurrentLocation"
        class="place-now-map map-control-button"
      >
        <b>📍 顯示我目前位置</b>
      </button>
    </div>

    <div ref="mapContainer" class="map-container"></div>

    <FilterPanel
      v-if="isFilterPanelOpen"
      @filter-changed="handleFilterChanged"
      @close-panel="toggleFilterPanel"
      @remove-applied-filter="handleRemoveAppliedFilter"
      :initial-filters="currentFilters"
    />

    <div v-if="googleMapsLoading || isLoading" class="loading-overlay">
      <div class="loader"></div>
      <p class="loading-message">載入中，請稍候...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import debounce from "lodash/debounce"; // 確保 lodash/debounce 已安裝

// --- 引入組件與 Google Maps Composable ---
import FilterPanel from "../../components/map/FilterPanel.vue"; // 確保路徑正確
import { useGoogleMaps } from "@/composable/useGoogleMaps"; // 確保路徑正確

// 環境變數中的 Google Maps API Key
// **重要：請確保 .env 檔案中是 VITE_Maps_API_KEY=你的Key**
const googleMapsApiKey = import.meta.env.VITE_Maps_API_KEY;

// --- 響應式狀態 ---
const isLoading = ref(false); // 用於本地數據或其他非地圖載入
const mapContainer = ref(null); // 地圖 DOM 元素的引用

// --- 引入 useGoogleMaps Composable ---
const {
  map, // Google Map 實例
  markers, // 地圖標記數組
  infoWindow, // 資訊視窗實例
  loading: googleMapsLoading, // 地圖 API 載入狀態 (來自 useGoogleMaps)
  loadGoogleMapsAPI, // 載入 API 腳本
  initMap, // 初始化地圖
  showInfoWindow, // 顯示資訊視窗
  closeInfoWindow, // 關閉資訊視窗
  panTo, // 平移地圖到指定位置
  setZoom, // 設定地圖縮放等級
  displayBarsOnMap, // 在地圖上顯示酒吧標記
  requestGeolocationPermission, // 請求地理定位權限
  getCurrentLocation: getMapCurrentLocation, // 獲取當前地理位置
  getPlacePredictions, // 獲取地點預測（用於搜尋建議）
  searchAndDisplayPlaces, // 搜尋地點並顯示在地圖上
  panToAndShowBarInfo, // 平移到酒吧位置並顯示其資訊
  error: googleMapsError, // 接收 useGoogleMaps 內部錯誤
} = useGoogleMaps(mapContainer, {
  googleMapsApiKey: googleMapsApiKey,
  // 透過這裡的回調來更新 MapView 的 loading 狀態，雖然我們已經有 googleMapsLoading 了
  onLoading: () => console.log("Google Maps API 載入中..."),
  onLoaded: () => console.log("Google Maps API 載入完成。"),
  onError: (msg) => {
    console.error("useGoogleMaps 錯誤:", msg);
    // 這裡可以使用一個 alert 或者在 UI 上顯示錯誤訊息
    alert(`地圖載入失敗：${msg}，請檢查API Key或網路。`);
  },
});

const isFilterPanelOpen = ref(false);
const searchQuery = ref("");
const suggestions = ref([]);
const allBars = ref([]); // 儲存所有酒吧數據
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

// ----------------------------------------------------------------------
// 計算屬性
// ----------------------------------------------------------------------

// 根據篩選條件過濾酒吧列表 (此計算屬性仍用於地圖標記的篩選)
const filteredBars = computed(() => {
  let barsToFilter = [...allBars.value];

  // 1. 地址篩選 (假設 address 是篩選 tags 裡的區域)
  if (currentFilters.value.address !== "any") {
    barsToFilter = barsToFilter.filter((bar) =>
      bar.tags.includes(currentFilters.value.address)
    );
  }

  // 2. 距離篩選 (需 Google Maps 的 geometry 庫計算距離)
  // 確保 map 實例和 geometry 庫都已載入
  if (map.value && window.google?.maps?.geometry?.spherical) {
    const mapCenter = map.value.getCenter();
    if (mapCenter) {
      const centerLatLng = new window.google.maps.LatLng(
        mapCenter.lat(),
        mapCenter.lng()
      );
      barsToFilter = barsToFilter
        .map((bar) => {
          const barLatLng = new window.google.maps.LatLng(
            bar.location.lat,
            bar.location.lng
          );
          // computeDistanceBetween 返回的是米
          bar.distance = window.google.maps.geometry.spherical.computeDistanceBetween(
            centerLatLng,
            barLatLng
          );
          return bar;
        })
        .filter((bar) => {
          // 這裡假設 min/maxDistance 單位與 bar.distance (米) 一致
          return (
            bar.distance !== undefined &&
            bar.distance >= currentFilters.value.minDistance &&
            bar.distance <= currentFilters.value.maxDistance
          );
        });
    }
  }

  // 3. 營業時間篩選 (處理跨日邏輯)
  if (
    currentFilters.value.minOpenHour !== 0 ||
    currentFilters.value.minOpenMinute !== 0 ||
    currentFilters.value.maxOpenHour !== 24 ||
    currentFilters.value.maxOpenMinute !== 0
  ) {
    barsToFilter = barsToFilter.filter((bar) => {
      const openHoursStr = bar.openingHours?.weekday_text?.[0] || "";
      const match = openHoursStr.match(/(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})/);

      if (!match) return false;

      let barOpenMinutes = parseInt(match[1]) * 60 + parseInt(match[2]);
      let barCloseMinutes = parseInt(match[3]) * 60 + parseInt(match[4]);
      if (barCloseMinutes < barOpenMinutes) {
        barCloseMinutes += 24 * 60; // 處理酒吧跨日營業
      }

      const filterMinMinutes =
        currentFilters.value.minOpenHour * 60 +
        currentFilters.value.minOpenMinute;
      let filterMaxMinutes =
        currentFilters.value.maxOpenHour * 60 +
        currentFilters.value.maxOpenMinute;
      if (
        currentFilters.value.maxOpenHour === 24 &&
        currentFilters.value.maxOpenMinute === 0
      ) {
        filterMaxMinutes = 24 * 60; // 24:00 應視為當天結束
      }
      if (filterMaxMinutes < filterMinMinutes) {
        filterMaxMinutes += 24 * 60; // 處理篩選條件的跨日
      }

      // 檢查時間區間是否有重疊
      // (barOpen, barClose) 與 (filterMin, filterMax) 重疊
      return (
        Math.max(barOpenMinutes, filterMinMinutes) <
        Math.min(barCloseMinutes, filterMaxMinutes)
      );
    });
  }

  // 4. 評分排序
  if (currentFilters.value.ratingSort === "highToLow") {
    barsToFilter.sort((a, b) => b.rating - a.rating);
  } else if (currentFilters.value.ratingSort === "lowToHigh") {
    barsToFilter.sort((a, b) => a.rating - b.rating);
  }

  // 5. 標籤篩選 (所有選中的標籤都必須存在於酒吧的 tags 中)
  if (currentFilters.value.tags && currentFilters.value.tags.length > 0) {
    barsToFilter = barsToFilter.filter((bar) =>
      currentFilters.value.tags.every((tag) => bar.tags.includes(tag))
    );
  }

  return barsToFilter;
});

// ----------------------------------------------------------------------
// 事件處理函式
// ----------------------------------------------------------------------

const debouncedSearchSuggestions = debounce(async () => {
  if (!searchQuery.value) {
    suggestions.value = [];
    return;
  }
  suggestions.value = await getPlacePredictions(searchQuery.value);
}, 300);

async function selectSuggestion(suggestion) {
  searchQuery.value = suggestion.description;
  suggestions.value = [];
  await handleSearch();
}

async function handleSearch() {
  if (!searchQuery.value) {
    alert("請輸入搜尋關鍵字");
    return;
  }
  // searchAndDisplayPlaces 應該會處理地圖移動和標記顯示
  await searchAndDisplayPlaces(searchQuery.value);
}

async function handleGetCurrentLocation() {
  isLoading.value = true; // 設置本地加載狀態
  try {
    // 這裡不再需要傳遞 sidebar 寬度，因為 sidebar 已移除
    // 如果未來側邊欄需要重新引入，這裡可能需要動態獲取寬度
    await getMapCurrentLocation(0);
  } catch (err) {
    console.error("獲取目前位置失敗:", err);
    // 錯誤訊息會通過 useGoogleMaps 的 onError 回調處理
  } finally {
    isLoading.value = false; // 清除本地加載狀態
  }
}

function handleFilterChanged(filters) {
  currentFilters.value = filters;
  // 篩選條件改變後，filteredBars 會自動重新計算，並觸發 watch 顯示地圖標記
}

function handleRemoveAppliedFilter(payload) {
  const { type, value } = payload;
  switch (type) {
    case "address":
      currentFilters.value.address = "any";
      break;
    case "ratingSort":
      currentFilters.value.ratingSort = "any";
      break;
    case "distance":
      currentFilters.value.minDistance = 0;
      currentFilters.value.maxDistance = 5000;
      break;
    case "openHour":
      currentFilters.value.minOpenHour = 0;
      currentFilters.value.minOpenMinute = 0;
      currentFilters.value.maxOpenHour = 24;
      currentFilters.value.maxOpenMinute = 0;
      break;
    case "tag":
      currentFilters.value.tags = currentFilters.value.tags.filter(
        (tag) => tag !== value
      );
      break;
  }
}

function toggleFilterPanel() {
  isFilterPanelOpen.value = !isFilterPanelOpen.value;
}

// 模擬獲取酒吧數據 (實際專案應替換為 API 請求)
// 此函數僅負責填充 allBars，不負責載入狀態
function fetchBarsData() {
  allBars.value = [
    {
      id: "b001",
      name: "微醺角落",
      location: { lat: 25.0478, lng: 121.5172 },
      rating: 4.5,
      reviews: 120,
      priceRange: "300-600",
      tags: ["精釀啤酒", "放鬆氛圍", "平價", "中山區"],
      openingHours: { weekday_text: ["週二至週日 18:00 - 01:00"] },
      imageUrl:
        "https://images.unsplash.com/photo-1543007137-b715ee51102b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      description: "隱身巷弄中的小酒館，提供多款精釀啤酒，適合下班小酌。",
      isWishlisted: false,
    },
    {
      id: "b002",
      name: "信義夜景酒吧",
      location: { lat: 25.0336, lng: 121.5644 },
      rating: 4.8,
      reviews: 350,
      priceRange: "800-1500",
      tags: ["高空美景", "創意調酒", "約會小酌", "信義區"],
      openingHours: { weekday_text: ["每日 20:00 - 02:00"] },
      imageUrl:
        "https://images.unsplash.com/photo-1582855171120-6d80f837e2c9?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      description: "俯瞰台北市夜景的絕佳地點，提供精緻調酒與餐點，是約會首選。",
      isWishlisted: true,
    },
    {
      id: "b003",
      name: "大安運動酒吧",
      rating: 4.2,
      reviews: 200,
      priceRange: "NT$ 400-900",
      openingHours: { weekday_text: ["每日 17:00 - 03:00"] },
      description: "提供多台大型螢幕轉播運動賽事，氛圍熱烈，適合與朋友一起看球",
      tags: ["運動酒吧", "大型螢幕", "觀賽熱點", "美式", "大安區"],
      imageUrl:
        "https://images.unsplash.com/photo-1543007137-b715ee51102b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      location: { lat: 25.038, lng: 121.543 },
    },
    {
      id: "b004",
      name: "松山爵士吧",
      location: { lat: 25.0505, lng: 121.5501 },
      rating: 4.7,
      reviews: 80,
      priceRange: "600-1200",
      tags: ["爵士樂", "現場表演", "復古", "調酒", "松山區"],
      openingHours: { weekday_text: ["週三至週日 20:30 - 01:30"] },
      imageUrl:
        "https://images.unsplash.com/photo-1620857106093-6c7e39a3f25c?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      description: "每晚有現場爵士樂表演，提供多款經典調酒，適合品味人士。",
      isWishlisted: false,
    },
    {
      id: "b005",
      name: "萬華老屋酒吧",
      location: { lat: 25.0375, lng: 121.5036 },
      rating: 4.3,
      reviews: 95,
      priceRange: "350-700",
      tags: ["老屋改造", "復古", "特色", "小酌", "萬華區"],
      openingHours: { weekday_text: ["週一至週六 19:00 - 00:00"] },
      imageUrl:
        "https://images.unsplash.com/photo-1567119054760-449e6d0a794c?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      description: "由老屋改造的特色酒吧，保留復古元素，提供獨特調酒。",
      isWishlisted: false,
    },
    {
      id: "b006",
      name: "士林文青酒吧",
      location: { lat: 25.0935, lng: 121.5235 },
      rating: 4.6,
      reviews: 150,
      priceRange: "450-800",
      tags: ["文青", "咖啡", "輕食", "獨立", "士林區"],
      openingHours: { weekday_text: ["週二至週日 14:00 - 23:00"] },
      imageUrl:
        "https://images.unsplash.com/photo-1624467362791-0391d84e4f58?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      description: "結合咖啡與酒精，氛圍輕鬆，適合閱讀或安靜小酌。",
      isWishlisted: false,
    },
    {
      id: "b007",
      name: "信義秘境",
      location: { lat: 25.041, lng: 121.567 },
      rating: 4.9,
      reviews: 90,
      priceRange: "700-1300",
      tags: ["秘密基地", "私密空間", "預約制", "信義區"],
      openingHours: { weekday_text: ["週三至週六 21:00 - 03:00"] },
      imageUrl:
        "https://images.unsplash.com/photo-1517409259508-3331b262a048?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      description: "隱藏在城市中的秘密酒吧，需要預約才能進入，提供客製化調酒。",
      isWishlisted: false,
    },
    {
      id: "b008",
      name: "大安居酒屋",
      location: { lat: 25.037, lng: 121.545 },
      rating: 4.4,
      reviews: 250,
      priceRange: "500-1000",
      tags: ["居酒屋", "日式", "燒烤", "深夜食堂", "大安區"],
      openingHours: { weekday_text: ["每日 18:00 - 00:00"] },
      imageUrl:
        "https://images.unsplash.com/photo-1549429402-d96201e523f4?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      description: "提供地道日式居酒屋氛圍，美味串燒與多種清酒。",
      isWishlisted: false,
    },
  ];
}

// ----------------------------------------------------------------------
// Vue 生命週期與監聽器
// ----------------------------------------------------------------------

onMounted(async () => {
  isLoading.value = true; // 開始載入本地數據或其他非地圖相關數據
  try {
    // 步驟 1: 載入 Google Maps API 腳本
    await loadGoogleMapsAPI();
    console.log("Google Maps API 載入完成，準備初始化地圖...");

    // 步驟 2: 初始化地圖 (確保 mapContainer 已綁定)
    if (mapContainer.value) {
      initMap();
      console.log("地圖初始化完成。");

      // 步驟 3: 獲取酒吧數據 (非 Google Maps API 數據)
      fetchBarsData(); // 僅獲取數據
      console.log("所有酒吧數據已載入:", allBars.value);

      // 步驟 4: 請求地理定位權限 (可選，但建議在地圖準備好後再請求)
      requestGeolocationPermission();
    } else {
      console.error("錯誤：地圖容器 ref 未綁定，無法初始化地圖。");
    }
  } catch (err) {
    console.error("地圖或數據載入失敗:", err);
    // 錯誤會被 useGoogleMaps 內部處理並通過 onError 回調
  } finally {
    isLoading.value = false; // 結束本地載入狀態
  }
});

// 監聽篩選後的酒吧列表，更新地圖上的標記
watch(
  filteredBars,
  (newBars) => {
    console.log("filteredBars 變化，準備在地圖上顯示標記:", newBars);
    // 確保地圖實例存在，才執行標記顯示
    if (map.value) {
      displayBarsOnMap(newBars);
    } else {
      console.warn("地圖實例尚未準備好，無法顯示酒吧標記。");
    }
  },
  { immediate: true } // 立即執行一次，確保初始數據的標記顯示
);
</script>

<style scoped>
/* 頁面整體佈局 */
.map-view-container {
  display: flex;
  height: 100vh; /* 確保容器有高度 */
  width: 100vw;
  overflow: hidden;
  position: relative;
}

/* 地圖左上角的控制區塊 */
.top-left-controls {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 100;
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding: 15px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* 通用地圖控制按鈕樣式 */
.map-control-button {
  padding: 12px 20px;
  border: none;
  background-color: #decdd5;
  color: black;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  white-space: nowrap;
  font-weight: bold;
  transition:
    background-color 0.2s,
    transform 0.2s;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  outline: none;
}

.map-control-button:hover {
  background-color: #a08d7a;
  transform: translateY(-2px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.map-control-button:focus {
  outline: none;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

/* 篩選按鈕的特定樣式 */
.filter-toggle-button {
  order: 1;
  padding: 0;
  background-color: transparent;
  box-shadow: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  font-size: 24px;
  color: #3a3435;
}

.filter-toggle-button:hover {
  background-color: rgba(0, 0, 0, 0.1);
  transform: translateY(0);
  box-shadow: none;
}

.filter-toggle-button:focus {
  outline: none;
  box-shadow: none;
}

.filter-toggle-button .fas {
  color: #3a3435;
}

/* 搜尋面板佈局 */
.search-panel-map {
  order: 2;
  display: flex;
  position: relative;
  width: 300px;
  flex-shrink: 1;
  align-items: center;
}

.input-group {
  display: flex;
  position: relative;
  width: 100%;
  gap: 0;
}

.search-input {
  height: 40px;
  padding: 8px 12px;
  font-size: 16px;
  border: 1px solid #decdd5;
  border-right: 0;
  border-radius: 8px 0 0 8px;
  outline: none;
  flex: 1;
  margin: 0;
}

.search-bt {
  background-color: #decdd5;
  color: #3a3435;
  padding: 8px 12px;
  margin: 0;
  border: 1px solid #decdd5;
  border-left: 0;
  border-radius: 0px 5px 5px 0px;
  cursor: pointer;
  order: 3;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  outline: none;
}

.search-bt:hover {
  background-color: #860914;
  color: #ffffff;
}

.search-input:focus {
  border-color: #b8a28e;
  box-shadow: 0 0 0 2px rgba(184, 162, 142, 0.2);
}

/* 顯示目前位置按鈕樣式 */
.place-now-map {
  padding: 8px 12px;
  margin: 0;
  border: none;
  background-color: #decdd5;
  color: #3a3435;
  border-radius: 5px;
  cursor: pointer;
  white-space: nowrap;
  order: 4;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  outline: none;
}

.place-now-map:hover {
  background-color: #860914;
  color: #ffffff;
}

/* 搜尋建議列表樣式 */
.suggestions-list {
  position: absolute;
  top: calc(100% + 5px);
  left: 0;
  right: 0;
  z-index: 20;
  list-style: none;
  margin: 0;
  padding: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}
.suggestions-list li {
  padding: 10px 12px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
}
.suggestions-list li:last-child {
  border-bottom: none;
}
.suggestions-list li:hover {
  background: #f0f0f0;
}

/* 資訊視窗內容樣式 */
/* 這些樣式通常是在 useGoogleMaps 內部渲染的，但放在這裡作為通用樣式也無妨 */
.info-window-content {
  padding: 15px;
  font-family: "Noto Sans TC", sans-serif;
  color: #333;
  max-width: 300px;
}

.info-window-title {
  font-size: 22px;
  font-weight: bold;
  margin-bottom: 8px;
  color: #2c3e50;
  line-height: 1.3;
}

.info-window-meta {
  font-size: 15px;
  color: #555;
  margin-bottom: 5px;
}

.info-window-description {
  font-size: 14px;
  color: #777;
  margin-top: 10px;
  line-height: 1.5;
}

.info-window-tags-container {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.info-window-tag {
  display: inline-block;
  background-color: #e9ecef;
  color: #495057;
  padding: 5px 10px;
  border-radius: 15px;
  font-size: 13px;
  white-space: nowrap;
}

.info-window-image {
  max-width: 100%;
  height: auto;
  margin-top: 10px;
  margin-bottom: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 地圖容器 */
.map-container {
  flex-grow: 1;
  height: 100%; /* 確保地圖容器填滿父元素的高度 */
  background-color: #e0e0e0; /* 可選的背景色，在地圖載入前顯示 */
}

/* 載入中遮罩 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(255, 255, 255, 0.85);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

/* 載入動畫樣式 */
.loader {
  width: 60px;
  height: 60px;
  --b: 8px;
  aspect-ratio: 1;
  border-radius: 50%;
  padding: 1px;
  background: conic-gradient(#0000 10%, #afb18c) content-box;
  -webkit-mask: repeating-conic-gradient(#0000 0deg, #000 1deg 20deg, #0000 21deg 36deg),
    radial-gradient(farthest-side, #0000 calc(100% - var(--b) - 1px), #000 calc(100% - var(--b)));
  -webkit-mask-composite: destination-in;
  mask-composite: intersect;
  animation: l4 1s infinite;
}

@keyframes l4 {
  to {
    transform: rotate(1turn);
  }
}

/* 如果你的側邊欄是響應式，可能需要調整 top-left-controls 的 left 值 */
@media (max-width: 768px) {
  .top-left-controls {
    left: 20px; /* 在小螢幕上調整位置 */
    width: calc(100% - 40px); /* 佔滿寬度 */
    flex-direction: column; /* 垂直排列 */
  }
  .search-panel-map {
    width: 100%;
  }
}
</style>