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
            :disabled="!isReady"
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

    <aside class="bar-list-sidebar">
      <div class="bar-list-scroll-area">
        <BarList
          :bars="filteredBars"
          @bar-selected="handleBarSelected"
          @toggle-wishlist="handleToggleWishlist"
        />
      </div>
    </aside>

    <div ref="mapContainer" class="map-container"></div>

    <FilterPanel
      v-if="isFilterPanelOpen"
      @filter-changed="handleFilterChanged"
      @close-panel="toggleFilterPanel"
      :initial-filters="currentFilters"
    />

    <BarDetailModal
      v-if="isBarDetailModalOpen"
      :bar="selectedBarForDetail"
      @close="closeBarDetailModal"
      @toggle-wishlist="handleToggleWishlistFromDetail"
    />

    <div v-if="combinedLoading" class="loading-overlay">
      <div class="loader"></div>
      <p class="loading-message">載入中，請稍候...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import debounce from "lodash/debounce";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
dayjs.extend(isBetween);

import FilterPanel from "../../components/map/FilterPanel.vue";
import BarList from "../../components/map/BarList.vue";
import BarDetailModal from "../../components/map/BarDetailModal.vue";
import { useGoogleMaps } from "@/composable/useGoogleMaps";

// --- 環境變數設定 ---
const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const myMapId = import.meta.env.VITE_MAP_ID;

// **新的酒吧圖標路徑**
const barIconUrl = "/bar_icon.png"; // 假設您的 bar_icon.png 放在 public 資料夾根目錄

// --- Template Refs ---
const mapContainer = ref(null); // 用於綁定地圖的 DOM 元素

// --- useGoogleMaps Composable ---
const {
  map,
  infoWindow,
  loading: googleMapsLoading, // 地圖API載入狀態
  isFetching, // 搜尋數據的載入狀態
  loadGoogleMapsAPI,
  initMap,
  showInfoWindow,
  closeInfoWindow,
  panTo,
  setZoom,
  // 傳遞自定義的酒吧圖標 URL
  displayBarsOnMap,
  requestGeolocationPermission,
  getCurrentLocation: getMapCurrentLocation,
  getPlacePredictions,
  searchAndDisplayPlaces,
  panToAndShowBarInfo,
  searchBarsInMapBounds,
  clearMarkers,
  searchNearbyBarsByLocation,
  google: googleMapsInstance, // 暴露 Google Maps API 實例 (readonly shallowRef)
  isReady,
} = useGoogleMaps(mapContainer, {
  googleMapsApiKey: googleMapsApiKey,
  mapId: myMapId,
  onError: (msg) => {
    console.error("useGoogleMaps 錯誤:", msg);
    alert(`地圖載入失敗：${msg}，請檢查API Key或網路連線。`);
  },
  barIconUrl: barIconUrl,
});

// --- 狀態管理 ---
const isFilterPanelOpen = ref(false);
const searchQuery = ref("");
const suggestions = ref([]);
const allBars = ref([]); // 儲存所有從 Google Places API 取得的酒吧數據
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
const selectedBar = ref(null); // 用於地圖資訊視窗和高亮
const isBarDetailModalOpen = ref(false);
const selectedBarForDetail = ref(null); // 用於 BarDetailModal
const isLoading = ref(false);
const googleBars = ref([]);
const mainBarForSearch = ref(null); // 專門存搜尋主酒吧

// --- Computed Properties ---
// 綜合地圖API載入和數據搜尋載入狀態
const combinedLoading = computed(
  () => googleMapsLoading.value || isFetching.value
);

const filteredBars = computed(() => {
  let bars = googleBars.value || [];
  if (!Array.isArray(bars)) bars = [];
  const filters = currentFilters.value;

  const districtTagsList = [
    "信義區",
    "大安區",
    "中山區",
    "松山區",
    "萬華區",
    "士林區",
  ];

  // 地址過濾
  if (filters.address !== "any") {
    bars = bars.filter((bar) =>
      bar.address?.includes(filters.address)
    );
  }

  // 標籤過濾 (包含區域標籤的特殊處理)
  if (filters.tags && filters.tags.length > 0) {
    const nonDistrictTags = filters.tags.filter(
      (tag) => !districtTagsList.includes(tag)
    );
    const selectedDistrictTagsFromTagsFilter = filters.tags.filter((tag) =>
      districtTagsList.includes(tag)
    );

    if (nonDistrictTags.length > 0) {
      bars = bars.filter((bar) =>
        nonDistrictTags.every((tag) => bar.tags?.includes(tag))
      );
    }

    if (selectedDistrictTagsFromTagsFilter.length > 0) {
      // 如果地址篩選器已選擇，且與標籤中的區域不符，則返回空
      if (filters.address !== "any") {
        if (!selectedDistrictTagsFromTagsFilter.includes(filters.address)) {
          return [];
        }
      } else {
        // 否則，根據標籤中的區域篩選
        bars = bars.filter((bar) =>
          selectedDistrictTagsFromTagsFilter.every((tag) => {
            return bar.address?.includes(tag);
          })
        );
      }
    }
  }

  // 距離過濾 (需要確保 Google Maps geometry 庫已載入)
  if (map.value && googleMapsInstance.value?.maps?.geometry?.spherical) {
    const mapCenter = map.value.getCenter();
    if (mapCenter) {
      const centerLatLng = new googleMapsInstance.value.LatLng(
        mapCenter.lat(),
        mapCenter.lng()
      );
      bars = bars
        .map((bar) => {
          if (
            !bar.location ||
            typeof bar.location.lat === "undefined" ||
            typeof bar.location.lng === "undefined"
          ) {
            return { ...bar, distance: Infinity }; // 無效位置設為無限遠
          }
          const barLatLng = new googleMapsInstance.value.LatLng(
            bar.location.lat,
            bar.location.lng
          );
          bar.distance =
            googleMapsInstance.value.maps.geometry.spherical.computeDistanceBetween(
              centerLatLng,
              barLatLng
            );
          return bar;
        })
        .filter((bar) => {
          return (
            bar.distance !== undefined &&
            bar.distance >= filters.minDistance &&
            bar.distance <= filters.maxDistance
          );
        });
    }
  }

  // 開放時間過濾
  if (
    filters.minOpenHour !== 0 ||
    filters.minOpenMinute !== 0 ||
    filters.maxOpenHour !== 24 ||
    filters.maxOpenMinute !== 0
  ) {
    bars = bars.filter((bar) => {
      const openHoursText = bar.opening_hours?.weekday_text?.[0] || "";
      const timeMatch = openHoursText.match(
        /(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})/
      );

      if (!timeMatch) return false; // 無法解析時間

      let barOpenTime = dayjs(timeMatch[1] + ":" + timeMatch[2], "HH:mm");
      let barCloseTime = dayjs(timeMatch[3] + ":" + timeMatch[4], "HH:mm");

      if (barCloseTime.isBefore(barOpenTime)) {
        barCloseTime = barCloseTime.add(1, "day"); // 處理跨夜時間
      }

      let filterOpenTime = dayjs()
        .hour(filters.minOpenHour)
        .minute(filters.minOpenMinute);
      let filterCloseTime = dayjs()
        .hour(filters.maxOpenHour)
        .minute(filters.maxOpenMinute);

      if (filters.maxOpenHour === 24 && filters.maxOpenMinute === 0) {
        filterCloseTime = dayjs().endOf("day").add(1, "minute"); // 處理到午夜的情況
      }

      if (filterCloseTime.isBefore(filterOpenTime)) {
        filterCloseTime = filterCloseTime.add(1, "day"); // 處理跨夜篩選
      }
      const isWithinHours =
        barOpenTime.isBefore(filterCloseTime) &&
        barCloseTime.isAfter(filterOpenTime);
      return isWithinHours;
    });
  }

  // 評分排序
  if (filters.ratingSort === "highToLow") {
    bars.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (filters.ratingSort === "lowToHigh") {
    bars.sort((a, b) => (a.rating || 0) - (b.rating || 0));
  }

  // 最上方插入 mainBarForSearch
  const result = [];
  if (mainBarForSearch.value) {
    result.push(mainBarForSearch.value);
  }
  result.push(...bars);
  return result;
});

// --- Debounced 函數 ---
const debouncedSearchSuggestions = debounce(async () => {
  if (!searchQuery.value) {
    suggestions.value = [];
    return;
  }
  suggestions.value = await getPlacePredictions(searchQuery.value);
}, 300);

// --- Methods ---

/**
 * 選擇搜尋建議並觸發搜尋
 * @param {object} suggestion - 選擇的建議對象
 */
async function selectSuggestion(suggestion) {
  searchQuery.value = suggestion.description;
  suggestions.value = []; // 清空建議列表
  await handleSearch(); // 執行搜尋
}

/**
 * 處理手動搜尋按鈕點擊
 */
async function handleSearch() {
  if (!isReady) {
    alert('地圖尚未載入完成，請稍候再試');
    return;
  }
  if (!searchQuery.value) {
    alert("請輸入搜尋關鍵字");
    return;
  }
  isLoading.value = true;
  try {
    // 1. 先搜尋
    const mainBars = await searchAndDisplayPlaces(searchQuery.value);
    // 判斷是否為「模糊搜尋」或「熱門關鍵字」
    const fuzzyKeywords = ["bar", "酒吧", "pub", "night club", "cafe"];
    const isFuzzy = fuzzyKeywords.some(k => searchQuery.value.toLowerCase().includes(k));
    if (isFuzzy) {
      // 模糊/熱門關鍵字：直接顯示所有搜尋結果
      mainBarForSearch.value = null;
      googleBars.value = mainBars;
    } else {
      // 精確搜尋＋附近 bar
      mainBarForSearch.value = mainBars && mainBars.length > 0 ? mainBars[0] : null;
      let relatedBars = [];
      if (mainBarForSearch.value && mainBarForSearch.value.location) {
        let radius = 600;
        const maxRadius = 3000;
        while (radius <= maxRadius) {
          relatedBars = await searchNearbyBarsByLocation(mainBarForSearch.value.location, radius);
          relatedBars = relatedBars.filter(bar => bar.place_id !== mainBarForSearch.value.place_id);
          if (relatedBars.length > 0) break;
          radius += 600;
        }
      }
      googleBars.value = [
        ...(mainBarForSearch.value ? [mainBarForSearch.value] : []),
        ...relatedBars
      ];
    }
    isLoading.value = false;
  } catch (err) {
    isLoading.value = false;
    mainBarForSearch.value = null;
    googleBars.value = [];
  }
}

/**
 * 處理獲取目前位置
 */
async function handleGetCurrentLocation() {
  try {
    // 側邊欄寬度用於調整地圖中心，以確保定位點在可視區域
    const sidebarWidth =
      document.querySelector(".bar-list-sidebar")?.offsetWidth || 0;
    await getMapCurrentLocation(sidebarWidth);
  } catch (err) {
    console.error("獲取目前位置失敗:", err);
    alert("無法獲取您的目前位置，請檢查瀏覽器權限設定。");
  }
}

/**
 * 處理過濾器變化
 * @param {object} filters - 新的過濾器設定
 */
function handleFilterChanged(filters) {
  currentFilters.value = { ...filters };
}

/**
 * 切換過濾面板的顯示狀態
 */
function toggleFilterPanel() {
  isFilterPanelOpen.value = !isFilterPanelOpen.value;
}

/**
 * 處理從 BarList 中選中酒吧
 * @param {object} bar - 被選中的酒吧對象
 */
async function handleBarSelected(bar) {
  selectedBarForDetail.value = bar || {};
  isBarDetailModalOpen.value = true;
}

/**
 * 關閉酒吧詳細資訊彈窗
 */
function closeBarDetailModal() {
  isBarDetailModalOpen.value = false;
  selectedBarForDetail.value = null;
  closeInfoWindow(); // 關閉地圖上的資訊視窗
}

/**
 * 處理願望清單切換 (來自 BarList)
 * @param {string} barId - 酒吧 ID
 */
function handleToggleWishlist(barId) {
  const barIndex = allBars.value.findIndex((b) => b.id === barId);
  if (barIndex > -1) {
    allBars.value[barIndex].isWishlisted =
      !allBars.value[barIndex].isWishlisted;
  }
  // 如果詳細資訊彈窗打開，也更新其狀態
  if (selectedBarForDetail.value && selectedBarForDetail.value.id === barId) {
    selectedBarForDetail.value.isWishlisted =
      !selectedBarForDetail.value.isWishlisted;
  }
}

/**
 * 處理願望清單切換 (來自 BarDetailModal)
 * @param {string} barId - 酒吧 ID
 */
const handleToggleWishlistFromDetail = (barId) => {
  handleToggleWishlist(barId); // 調用共同的處理函數
};

// --- Watchers ---

// 監聽 mapContainer ref，確保 DOM 元素準備就緒後才初始化地圖
// 這個 watch 會在 mapContainer 被設置 (DOM 元素可用) 後觸發
watch(
  mapContainer,
  (newVal) => {
    if (newVal) {
      console.log("mapContainer DOM 元素已準備好。");
      // 只有在 Google Maps API 已經載入，且地圖實例尚未初始化時才調用 initMap
      if (googleMapsInstance.value && !map.value) {
        console.log(
          "mapContainer 和 Google Maps API 已準備好，嘗試初始化地圖..."
        );
        initMap();
      }
    }
  },
  { immediate: true } // 立即執行一次，以防 mapContainer 在組件掛載時已經有值
);

// 監聽 map 實例，當它準備好時，添加拖曳和縮放事件監聽器
watch(map, (newMap) => {
  if (newMap && googleMapsInstance.value) {
    console.log("Map 實例已準備就緒，添加事件監聽器。");
    // 監聽地圖拖曳結束，觸發區域內搜尋
    newMap.addListener("dragend", async () => {
      console.log("地圖拖曳結束。");
    });

    // 監聽地圖縮放結束，觸發區域內搜尋
    newMap.addListener("zoom_changed", async () => {
      console.log("地圖縮放等級改變。");
    });
  }
});

// 監聽 filteredBars 變化，更新地圖上的酒吧標記
watch(
  filteredBars,
  (newBars) => {
    if (map.value && googleMapsInstance.value) {
      console.log(`filteredBars 變更，準備顯示 ${newBars.length} 個酒吧標記。`);
      // 這裡調用 displayBarsOnMap，它會使用傳入的 barIconUrl
      displayBarsOnMap(newBars);
    } else {
      console.warn("地圖或 Google Maps 實例未準備好，無法顯示酒吧標記。");
    }
  },
  { immediate: false } // 不在初始化時立即執行，等待地圖載入
);

// 監聽 selectedBar 變化，如果為空且詳細資訊彈窗未打開，則關閉資訊視窗
watch(selectedBar, (newVal) => {
  if (!newVal && !isBarDetailModalOpen.value) {
    closeInfoWindow();
  }
});

// --- Lifecycle Hooks ---
onMounted(async () => {
  console.log("MapView component mounted.");
  try {
    // 1. 載入 Google Maps API，等待其完成
    await loadGoogleMapsAPI();
    console.log("Google Maps API 載入完成並可用。");

    // 2. 確保 mapContainer ref 已經被設置，並且地圖尚未初始化，則手動觸發 initMap
    if (mapContainer.value && !map.value) {
      console.log("在 onMounted 中手動觸發 initMap...");
      initMap();
    }

    // 3. 請求地理位置權限 (非同步但非阻塞)
    requestGeolocationPermission();
  } catch (err) {
    console.error("MapView 初始化失敗:", err);
    alert("初始化地圖或數據失敗，請檢查控制台錯誤。");
  }
});
</script>

<style scoped>
/* 樣式部分保持不變 */
.map-view-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  position: relative;
}

.top-left-controls {
  position: absolute;
  top: 20px;
  left: calc(380px + 20px);
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
  transition: left 0.3s ease-in-out;
}

.bar-list-sidebar {
  width: 380px;
  background-color: #f7f7f7;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  z-index: 50;
  transition: transform 0.3s ease-in-out;
}

.bar-list-sidebar.sidebar-hidden {
  transform: translateX(-100%);
  position: absolute;
}

.map-control-button {
  padding: 12px 20px;
  border: none;
  background-color: #decdd5;
  color: black;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  white-space: nowrap;
  font-weight: 200;
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

.bar-list-scroll-area {
  flex-grow: 1;
  overflow-y: auto;
  padding: 16px;
}

.no-bars-message {
  text-align: center;
  color: #666;
  margin-top: 20px;
  font-size: 18px;
}

.map-container {
  flex-grow: 1;
  height: 100%;
  background-color: #e0e0e0;
}

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

.loader {
  width: 60px;
  height: 60px;
  --b: 8px;
  aspect-ratio: 1;
  border-radius: 50%;
  padding: 1px;
  background: conic-gradient(#0000 10%, #afb18c) content-box;
  -webkit-mask:
    repeating-conic-gradient(#0000 0deg, #000 1deg 20deg, #0000 21deg 36deg),
    radial-gradient(
      farthest-side,
      #0000 calc(100% - var(--b) - 1px),
      #000 calc(100% - var(--b))
    );
  -webkit-mask-composite: destination-in;
  mask-composite: intersect;
  animation: l4 1s infinite;
}

@keyframes l4 {
  to {
    transform: rotate(1turn);
  }
}

.remove-filter-button:hover {
  opacity: 1;
}

@media (max-width: 768px) {
  .top-left-controls {
    left: 20px;
    width: calc(100% - 40px);
    flex-direction: column;
  }
  .search-panel-map {
    width: 100%;
  }
}
</style>
