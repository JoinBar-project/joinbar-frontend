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
      @remove-applied-filter="handleRemoveAppliedFilter"
      :initial-filters="currentFilters"
    />

    <BarDetailModal
      v-if="isBarDetailModalOpen && selectedBarForDetail"
      :bar="selectedBarForDetail"
      @close="closeBarDetailModal"
      @toggle-wishlist="handleToggleWishlistFromDetail"
    />

    <div
      v-if="googleMapsLoading || (isLoading && !firstLoadDone)"
      class="loading-overlay"
    >
      <div class="loader"></div>
      <p class="loading-message">載入中，請稍候...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, shallowRef } from "vue";
import debounce from "lodash/debounce";

// --- 引入組件與 Google Maps Composable ---
import FilterPanel from "../../components/map/FilterPanel.vue";
import BarList from "../../components/map/BarList.vue";
import BarDetailModal from "../../components/map/BarDetailModal.vue";
import { useGoogleMaps } from "@/composable/useGoogleMaps";

// 環境變數中的 Google Maps API Key
const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// --- 響應式狀態 ---
const isLoading = ref(false);
const mapContainer = ref(null);
const firstLoad = ref(true);
const isFetching = ref(false);
const hasFirstLoad = ref(false);
const firstMapMarkersDrawn = ref(false);
const firstLoadDone = ref(false);

// --- 引入 useGoogleMaps Composable ---
const {
  map,
  markers,
  infoWindow,
  loading: googleMapsLoading,
  loadGoogleMapsAPI,
  initMap,
  showInfoWindow,
  closeInfoWindow,
  panTo,
  setZoom,
  displayBarsOnMap,
  requestGeolocationPermission,
  getCurrentLocation: getMapCurrentLocation,
  getPlacePredictions,
  textSearch,
  getPlaceDetails,
  panToAndShowBarInfo,
  searchBarsInMapBounds: searchBarsInMapBoundsFromComposable,
} = useGoogleMaps(mapContainer, {
  googleMapsApiKey: googleMapsApiKey,
  // 透過這裡的回調來更新 MapView 的 loading 狀態
  onLoading: () => console.log("Google Maps API 載入中..."),
  onLoaded: () => console.log("Google Maps API 載入完成。"),
  onError: (msg) => {
    console.error("useGoogleMaps 錯誤:", msg);
    alert(`地圖載入失敗：${msg}，請檢查API Key或網路。`);
  },
});

const isFilterPanelOpen = ref(false);
const searchQuery = ref("");
const suggestions = ref([]);
const googleBars = ref([]); // 只用 Google 搜尋到的酒吧
const currentFilters = ref({}); // 篩選功能可後續補強
const selectedBar = ref(null); // 這用於地圖上的 infoWindow
const isBarDetailModalOpen = ref(false); // 新增：控制酒吧詳細頁面的顯示
const selectedBarForDetail = ref(null); // 新增：儲存要顯示在詳細頁面的酒吧數據

// Google Place 詳細資料快取
const googlePlaceCache = ref({}); // placeId: 詳細資料

// ----------------------------------------------------------------------
// 計算屬性
// ----------------------------------------------------------------------

// 新增：台北常用行政區中心座標
const districtCenters = {
  信義區: { lat: 25.033, lng: 121.5654 },
  大安區: { lat: 25.0268, lng: 121.543 },
  中山區: { lat: 25.0526, lng: 121.5325 },
  松山區: { lat: 25.0505, lng: 121.5747 },
  萬華區: { lat: 25.036, lng: 121.4997 },
  士林區: { lat: 25.0928, lng: 121.5246 },
  // ...可依需求擴充
};

// 根據篩選條件過濾酒吧列表
const filteredBars = computed(() => {
  let bars = googleBars.value;

  // 評價排序
  if (
    currentFilters.value.ratingSort &&
    currentFilters.value.ratingSort !== "any"
  ) {
    if (currentFilters.value.ratingSort === "highToLow") {
      bars = [...bars].sort((a, b) => b.rating - a.rating);
    } else if (currentFilters.value.ratingSort === "lowToHigh") {
      bars = [...bars].sort((a, b) => a.rating - b.rating);
    } else if (currentFilters.value.ratingSort === "mostPopular") {
      bars = [...bars].sort((a, b) => b.reviews - a.reviews);
    }
  }

  // 距離篩選
  if (
    typeof currentFilters.value.minDistance === "number" &&
    typeof currentFilters.value.maxDistance === "number"
  ) {
    const center = map.value?.getCenter?.();
    if (center) {
      bars = bars.filter((bar) => {
        if (!bar.location) return false;
        // 使用 Haversine 公式計算距離
        const toRad = (deg) => (deg * Math.PI) / 180;
        const R = 6371000; // 地球半徑（公尺）
        const dLat = toRad(bar.location.lat - center.lat());
        const dLng = toRad(bar.location.lng - center.lng());
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(toRad(center.lat())) *
            Math.cos(toRad(bar.location.lat)) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return (
          distance >= currentFilters.value.minDistance &&
          distance <= currentFilters.value.maxDistance
        );
      });
    }
  }

  // 標籤篩選（只針對非行政區型 tag）
  const allDistricts = Object.keys(districtCenters);
  const nonDistrictTags = Array.isArray(currentFilters.value.tags)
    ? currentFilters.value.tags.filter((tag) => !allDistricts.includes(tag))
    : [];
  if (nonDistrictTags.length > 0) {
    bars = bars.filter((bar) =>
      nonDistrictTags.some(
        (tag) =>
          (bar.types && bar.types.includes(tag)) ||
          (bar.name && bar.name.includes(tag)) ||
          (bar.vicinity && bar.vicinity.includes(tag))
      )
    );
  }

  // 營業時間（僅能過濾有 open_now 或 opening_hours 的 bar，Google API 支援有限）
  // ...可根據需求補充

  return bars;
});

function shallowEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i]?.place_id !== arr2[i]?.place_id) return false;
  }
  return true;
}

let lastDrawnBars = [];
watch(
  filteredBars,
  (newBars) => {
    // 只在資料真正變動時才呼叫 displayBarsOnMap
    if (!firstMapMarkersDrawn.value) {
      if (map.value) {
        displayBarsOnMap(newBars);
        firstMapMarkersDrawn.value = true;
        lastDrawnBars = [...newBars];
      }
      return;
    }
    if (!shallowEqual(newBars, lastDrawnBars)) {
      if (map.value) {
        displayBarsOnMap(newBars);
        lastDrawnBars = [...newBars];
      }
    }
  }
  // 不要 immediate: true，避免初始化時重複觸發
);

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
  isLoading.value = true;
  try {
    // 1. 先用 textSearch 找地點
    const results = await textSearch(searchQuery.value);
    if (
      results &&
      results.length > 0 &&
      results[0].geometry &&
      results[0].geometry.location
    ) {
      // 2. 將地圖移動到搜尋到的地點
      const loc = results[0].geometry.location;
      map.value.setCenter({
        lat: typeof loc.lat === "function" ? loc.lat() : loc.lat,
        lng: typeof loc.lng === "function" ? loc.lng() : loc.lng,
      });
      map.value.setZoom(16);
      // 3. 等地圖移動完成後再查詢該地點附近酒吧
      window.google.maps.event.addListenerOnce(map.value, "idle", async () => {
        await searchBarsInMapBounds(true);
        isLoading.value = false;
      });
    } else {
      alert("找不到相關地點，請換個關鍵字");
      isLoading.value = false;
    }
  } catch (err) {
    alert("搜尋失敗，請稍後再試");
    isLoading.value = false;
  }
}

async function handleGetCurrentLocation() {
  isLoading.value = true;
  try {
    await getMapCurrentLocation(
      document.querySelector(".bar-list-sidebar")?.offsetWidth || 0
    );
    await searchBarsInMapBounds(true);
  } catch (err) {
    console.error("獲取目前位置失敗:", err);
    alert("無法獲取您的目前位置，請檢查瀏覽器權限設定。");
  } finally {
    isLoading.value = false;
  }
}

function handleFilterChanged(filters) {
  // 熱門推薦的 tag 若是行政區，優先以該區域導航
  const allDistricts = Object.keys(districtCenters);
  // 先判斷 tags 裡是否有行政區
  const selectedDistrictTag = Array.isArray(filters.tags)
    ? filters.tags.find((tag) => allDistricts.includes(tag))
    : null;
  // 若同時選擇地點與 tag 行政區，以 tag 為主
  const targetDistrict =
    selectedDistrictTag || (filters.address !== "any" ? filters.address : null);
  if (targetDistrict && districtCenters[targetDistrict]) {
    const { lat, lng } = districtCenters[targetDistrict];
    if (map.value) {
      map.value.setCenter({ lat, lng });
      map.value.setZoom(15);
    }
    setTimeout(() => {
      currentFilters.value = { ...filters, address: targetDistrict };
      searchBarsInMapBounds(true);
    }, 500);
  } else {
    currentFilters.value = filters;
    searchBarsInMapBounds(true);
  }
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

// 地圖初始化或移動時自動搜尋酒吧
async function searchBarsInMapBounds(showLoading = false) {
  if (!map.value || !map.value.getBounds()) return;
  if (isFetching.value) return;
  isFetching.value = true;
  try {
    const bounds = map.value.getBounds();
    const center = bounds.getCenter();
    if (!center) return;
    if (showLoading) isLoading.value = true;
    const newBars = await searchBarsInMapBoundsFromComposable(showLoading);
    if (
      Array.isArray(newBars) &&
      JSON.stringify(googleBars.value) !== JSON.stringify(newBars)
    ) {
      googleBars.value = newBars;
    }
    if (showLoading) isLoading.value = false;
  } catch (err) {
    console.error("searchBarsInMapBounds error:", err);
  } finally {
    isFetching.value = false;
  }
}

// 修改 handleBarSelected，現在它會打開詳細頁面
async function handleBarSelected(bar) {
  selectedBar.value = bar; // 這個是給地圖 infoWindow 用的
  isBarDetailModalOpen.value = true; // 開啟詳細頁面

  // 先檢查快取
  let googleDetail = null;
  if (bar.place_id) {
    googleDetail = googlePlaceCache.value[bar.place_id];
    if (!googleDetail) {
      googleDetail = await getPlaceDetails(bar.place_id);
      if (googleDetail) {
        googlePlaceCache.value[bar.place_id] = googleDetail;
      }
    }
  }

  // 合併 Google 詳細資料到 bar，所有欄位都加 fallback 預設值
  selectedBarForDetail.value = {
    ...bar,
    ...googleDetail,
    // 圖片
    images:
      googleDetail?.photos && googleDetail.photos.length
        ? googleDetail.photos.map((photo) =>
            photo.getUrl({ maxWidth: 800, maxHeight: 600 })
          )
        : bar.images && bar.images.length
          ? bar.images
          : bar.imageUrl
            ? [bar.imageUrl]
            : [],
    // 評論
    googleReviews: googleDetail?.reviews || [],
    // 標籤
    tags: bar.tags || googleDetail?.types || [],
    // 營業時間
    openingHours:
      googleDetail?.opening_hours ||
      bar.openingHours ||
      bar.opening_hours ||
      {},
    opening_hours:
      googleDetail?.opening_hours ||
      bar.openingHours ||
      bar.opening_hours ||
      {},
    // 介紹
    description:
      bar.description || googleDetail?.editorial_summary?.overview || "",
  };

  panToAndShowBarInfo(bar);
}

// 關閉酒吧詳細頁面
function closeBarDetailModal() {
  isBarDetailModalOpen.value = false;
  selectedBarForDetail.value = null;
  closeInfoWindow(); // 關閉地圖上的資訊視窗
}

// 處理來自 BarList 或 BarDetailModal 的收藏切換事件
function handleToggleWishlist(barId) {
  const barIndex = googleBars.value.findIndex((b) => b.id === barId);
  if (barIndex > -1) {
    googleBars.value[barIndex].isWishlisted =
      !googleBars.value[barIndex].isWishlisted;
  }
  // 確保如果詳細頁面打開，它的收藏狀態也能同步更新
  if (selectedBarForDetail.value && selectedBarForDetail.value.id === barId) {
    selectedBarForDetail.value.isWishlisted =
      !selectedBarForDetail.value.isWishlisted;
  }
}

// BarDetailModal 也可能觸發收藏，讓它調用同一個處理函數
const handleToggleWishlistFromDetail = (barId) => {
  handleToggleWishlist(barId);
};

// ----------------------------------------------------------------------
// Vue 生命週期與監聽器
// ----------------------------------------------------------------------

onMounted(async () => {
  isLoading.value = true;
  try {
    await loadGoogleMapsAPI();
    if (mapContainer.value) {
      initMap();
      try {
        // 嘗試自動定位
        await getMapCurrentLocation(
          document.querySelector(".bar-list-sidebar")?.offsetWidth || 0
        );
      } catch (err) {
        console.warn("自動定位失敗，將以預設中心查詢:", err);
        // 定位失敗時不做任何事，地圖會停在預設中心
      }
      // 以目前地圖中心查詢附近酒吧
      await searchBarsInMapBounds(true);
      hasFirstLoad.value = true;
      requestGeolocationPermission();
    } else {
      console.error("錯誤：地圖容器 ref 未綁定，無法初始化地圖。");
    }
  } catch (err) {
    console.error("地圖或數據載入失敗:", err);
    alert("初始化失敗，請檢查控制台錯誤。");
  } finally {
    isLoading.value = false;
    firstLoadDone.value = true;
  }
});

// 監聽選中的酒吧，並在地圖上顯示其資訊視窗
// 此 watch 現在只負責地圖上的 infoWindow，不直接控制詳細頁面
watch(selectedBar, (newVal) => {
  if (newVal && map.value && !isBarDetailModalOpen.value) {
    // 只有當詳細頁面沒有打開時，才顯示地圖上的 infoWindow
  } else if (!isBarDetailModalOpen.value) {
    closeInfoWindow();
  }
});
</script>

<style scoped>
/* 您的現有樣式保持不變 */
/* 頁面整體佈局 */
.map-view-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  position: relative;
}

/* 地圖左上角的控制區塊 */
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

/* 酒吧列表側邊欄 */
.bar-list-sidebar {
  width: 380px;
  background-color: #f7f7f7;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  z-index: 50;
  transition: transform 0.3s ease-in-out;
}

/* 隱藏側邊欄的狀態 (如果您有這個功能，請確保樣式生效) */
.bar-list-sidebar.sidebar-hidden {
  transform: translateX(-100%);
  position: absolute;
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

/* 酒吧列表可滾動區域 */
.bar-list-scroll-area {
  flex-grow: 1;
  overflow-y: auto;
  padding: 16px;
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

/* 移除篩選按鈕的懸停效果 (這可能與其他樣式衝突，請確認用途) */
.remove-filter-button:hover {
  opacity: 1;
}

/* 如果你的側邊欄是響應式，可能需要調整 top-left-controls 的 left 值 */
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
