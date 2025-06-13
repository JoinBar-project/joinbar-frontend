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

import FilterPanel from "../../components/map/FilterPanel.vue";
import BarList from "../../components/map/BarList.vue";
import BarDetailModal from "../../components/map/BarDetailModal.vue";
import { useGoogleMaps } from "@/composable/useGoogleMaps";

const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const isLoading = ref(false);
const mapContainer = ref(null);
const firstLoad = ref(true);
const isFetching = ref(false);
const hasFirstLoad = ref(false);
const firstMapMarkersDrawn = ref(false);
const firstLoadDone = ref(false);

const {
  map,
  markers,
  loading: googleMapsLoading,
  loadGoogleMapsAPI,
  initMap,
  panTo,
  setZoom,
  requestGeolocationPermission,
  getCurrentLocation: getMapCurrentLocation,
  getPlacePredictions,
  textSearch,
  getPlaceDetails,
  searchBarsInMapBounds: searchBarsInMapBoundsFromComposable,
  displayBarsOnMap,
} = useGoogleMaps(mapContainer, {
  googleMapsApiKey: googleMapsApiKey,
  onLoading: () => console.log("Google Maps API 載入中..."),
  onLoaded: () => console.log("Google Maps API 載入完成。"),
  onError: (msg) => {
    console.error("useGoogleMaps 錯誤:", msg);
    alert(`地圖載入失敗：${msg}，請檢查API Key或網路。`);
  },
  onMapIdle: () => {
    if (!isLoading.value) {
      searchBarsInMapBounds(false);
    }
  },
});

const isFilterPanelOpen = ref(false);
const searchQuery = ref("");
const suggestions = ref([]);
const googleBars = ref([]);
const currentFilters = ref({});
const selectedBar = ref(null);
const isBarDetailModalOpen = ref(false);
const selectedBarForDetail = ref(null);

const googlePlaceCache = ref({});

const districtCenters = {
  信義區: { lat: 25.033, lng: 121.5654 },
  大安區: { lat: 25.0268, lng: 121.543 },
  中山區: { lat: 25.0526, lng: 121.5325 },
  松山區: { lat: 25.0505, lng: 121.5747 },
  萬華區: { lat: 25.036, lng: 121.4997 },
  士林區: { lat: 25.0928, lng: 121.5246 },
};

const filteredBars = computed(() => {
  let bars = googleBars.value;

  if (
    currentFilters.value.ratingSort &&
    currentFilters.value.ratingSort !== "any"
  ) {
    if (currentFilters.value.ratingSort === "highToLow") {
      bars = [...bars].sort((a, b) => b.rating - a.rating);
    } else if (currentFilters.value.ratingSort === "lowToHigh") {
      bars = [...bars].sort((a, b) => a.rating - b.rating);
    } else if (currentFilters.value.ratingSort === "mostPopular") {
      bars = [...bars].sort(
        (a, b) => b.user_ratings_total - a.user_ratings_total
      ); // 使用 user_ratings_total 進行熱門排序
    }
  }

  if (
    typeof currentFilters.value.minDistance === "number" &&
    typeof currentFilters.value.maxDistance === "number" &&
    (currentFilters.value.minDistance !== 0 ||
      currentFilters.value.maxDistance !== 5000) // 僅在範圍非預設時篩選
  ) {
    const center = map.value?.getCenter?.();
    if (center) {
      bars = bars.filter((bar) => {
        if (!bar.location) return false;
        const toRad = (deg) => (deg * Math.PI) / 180;
        const R = 6371000;
        const dLat = toRad(bar.location.lat - center.lat());
        const dLng = toRad(bar.location.lng - center.lng());
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(toRad(center.lat())) *
            Math.cos(toRad(bar.location.lat)) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // 距離為公尺
        return (
          distance >= currentFilters.value.minDistance &&
          distance <= currentFilters.value.maxDistance
        );
      });
    }
  }

  // 標籤篩選 (現在會套用所有選定的標籤，包括行政區標籤)
  if (
    Array.isArray(currentFilters.value.tags) &&
    currentFilters.value.tags.length > 0
  ) {
    const selectedTags = currentFilters.value.tags;
    bars = bars.filter((bar) =>
      selectedTags.some(
        (tag) =>
          (bar.name && bar.name.toLowerCase().includes(tag.toLowerCase())) ||
          (bar.vicinity &&
            bar.vicinity.toLowerCase().includes(tag.toLowerCase())) ||
          (bar.types &&
            bar.types.some((type) =>
              type.toLowerCase().includes(tag.toLowerCase())
            )) || // 檢查 bar.types 是否包含標籤
          (bar.formatted_address &&
            bar.formatted_address.toLowerCase().includes(tag.toLowerCase())) // 檢查格式化地址
      )
    );
  }

  // 地點篩選 (針對地點下拉選單，若已選定行政區，則進一步篩選列表)
  if (currentFilters.value.address && currentFilters.value.address !== "any") {
    const selectedDistrict = currentFilters.value.address;
    bars = bars.filter(
      (bar) =>
        (bar.vicinity && bar.vicinity.includes(selectedDistrict)) ||
        (bar.formatted_address &&
          bar.formatted_address.includes(selectedDistrict))
    );
  }

  // 營業時間篩選功能 (此處僅為骨架，需根據實際 bar 資料結構和 Google API 支援來實現)
  // 如果 bar 物件中包含 `opening_hours` 資訊 (例如 daily_opening_hours 或 current_status)，
  // 可以在此處實作複雜的時間篩選邏輯。
  // 目前 Google Places API 的 PlaceResult 不直接提供簡單的 "is_open_now" 或精確的 "open at time X" 篩選。

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
watch(filteredBars, (newBars) => {
  if (!firstMapMarkersDrawn.value) {
    if (map.value) {
      displayBarsOnMap(newBars, handleBarSelected);
      firstMapMarkersDrawn.value = true;
      lastDrawnBars = [...newBars];
    }
    return;
  }
  if (!shallowEqual(newBars, lastDrawnBars)) {
    if (map.value) {
      displayBarsOnMap(newBars, handleBarSelected);
      lastDrawnBars = [...newBars];
    }
  }
});

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
    const results = await textSearch(searchQuery.value);
    if (
      results &&
      results.length > 0 &&
      results[0].geometry &&
      results[0].geometry.location
    ) {
      const loc = results[0].geometry.location;
      map.value.setCenter({
        lat: typeof loc.lat === "function" ? loc.lat() : loc.lat,
        lng: typeof loc.lng === "function" ? loc.lng() : loc.lng,
      });
      map.value.setZoom(16);
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
  const allDistricts = Object.keys(districtCenters);
  const selectedDistrictTag = Array.isArray(filters.tags)
    ? filters.tags.find((tag) => allDistricts.includes(tag))
    : null;
  const targetDistrict =
    selectedDistrictTag || (filters.address !== "any" ? filters.address : null);
  if (targetDistrict && districtCenters[targetDistrict]) {
    const { lat, lng } = districtCenters[targetDistrict];
    if (map.value) {
      map.value.setCenter({ lat, lng });
      map.value.setZoom(15);
    }
    // 短暫延遲後更新篩選並搜尋，確保地圖先定位
    setTimeout(() => {
      currentFilters.value = { ...filters }; // 直接更新為所有篩選
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
    case "tags": // 這裡使用 'tags' 與 FilterPanel.vue 的 type 保持一致
      currentFilters.value.tags = currentFilters.value.tags.filter(
        (tag) => tag !== value
      );
      break;
  }
  // 移除篩選後立即重新應用篩選
  searchBarsInMapBounds(true); // 重新觸發地圖範圍內的搜尋
}

function toggleFilterPanel() {
  isFilterPanelOpen.value = !isFilterPanelOpen.value;
}

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

async function handleBarSelected(bar) {
  selectedBarForDetail.value = null;
  isBarDetailModalOpen.value = true;

  if (bar.location) {
    panTo(bar.location);
    setZoom(15);
  }

  let googleDetail = null;
  if (bar.place_id) {
    googleDetail = googlePlaceCache.value[bar.place_id];
    if (!googleDetail) {
      console.log(`Fetching details for placeId: ${bar.place_id}`);
      googleDetail = await getPlaceDetails(bar.place_id);
      if (googleDetail) {
        googlePlaceCache.value[bar.place_id] = googleDetail;
        console.log("Fetched details:", googleDetail);
      } else {
        console.warn("Failed to fetch details for placeId:", bar.place_id);
      }
    } else {
      console.log("Using cached details for placeId:", bar.place_id);
    }
  }

  selectedBarForDetail.value = {
    ...bar,
    location: {
      lat:
        typeof bar.location.lat === "function"
          ? bar.location.lat()
          : bar.location.lat,
      lng:
        typeof bar.location.lng === "function"
          ? bar.location.lng()
          : bar.location.lng,
    },
    formatted_address:
      googleDetail?.formatted_address || bar.formatted_address || "N/A",
    international_phone_number:
      googleDetail?.international_phone_number ||
      bar.international_phone_number ||
      "N/A",
    website: googleDetail?.website || bar.website || "",
    rating: googleDetail?.rating || bar.rating || 0,
    user_ratings_total:
      googleDetail?.user_ratings_total || bar.user_ratings_total || 0,
    images:
      googleDetail?.photos && googleDetail.photos.length > 0
        ? googleDetail.photos.map((photo) =>
            photo.getUrl({ maxWidth: 800, maxHeight: 600 })
          )
        : bar.images && bar.images.length > 0
          ? bar.images
          : bar.imageUrl
            ? [bar.imageUrl]
            : [],
    googleReviews: googleDetail?.reviews || [],
    tags: bar.tags || googleDetail?.types || [],
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
    description:
      googleDetail?.editorial_summary?.overview || bar.description || "",
  };
  console.log("Selected bar for detail:", selectedBarForDetail.value);
}

function closeBarDetailModal() {
  isBarDetailModalOpen.value = false;
  selectedBarForDetail.value = null;
}

function handleToggleWishlist(barId) {
  const barIndex = googleBars.value.findIndex((b) => b.id === barId);
  if (barIndex > -1) {
    googleBars.value[barIndex].isWishlisted =
      !googleBars.value[barIndex].isWishlisted;
  }
  if (selectedBarForDetail.value && selectedBarForDetail.value.id === barId) {
    selectedBarForDetail.value.isWishlisted =
      !selectedBarForDetail.value.isWishlisted;
  }
}

const handleToggleWishlistFromDetail = (barId) => {
  handleToggleWishlist(barId);
};

onMounted(async () => {
  isLoading.value = true;
  try {
    await loadGoogleMapsAPI();
    if (mapContainer.value) {
      initMap();
      try {
        await getMapCurrentLocation(
          document.querySelector(".bar-list-sidebar")?.offsetWidth || 0
        );
      } catch (err) {
        console.warn("自動定位失敗，將以預設中心查詢:", err);
      }
      await searchBarsInMapBounds(true);
      firstLoadDone.value = true;
      requestGeolocationPermission();
    } else {
      console.error("錯誤：地圖容器 ref 未綁定，無法初始化地圖。");
    }
  } catch (err) {
    console.error("地圖或數據載入失敗:", err);
    alert("初始化失敗，請檢查控制台錯誤。");
  } finally {
    isLoading.value = false;
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
  height: 100%;
  background-color: #e0e0e0;
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
