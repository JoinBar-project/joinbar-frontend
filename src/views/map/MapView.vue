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

    <Transition name="fade">
      <FilterPanel
        v-if="isFilterPanelOpen"
        @filter-changed="handleFilterChanged"
        @close-panel="toggleFilterPanel"
        @remove-applied-filter="handleRemoveAppliedFilter"
        :initial-filters="currentFilters"
        :class="{ open: isFilterPanelOpen }"
      />
    </Transition>

    <BarDetailModal
      v-if="isBarDetailModalOpen && selectedBarForDetail"
      :bar="selectedBarForDetail"
      @close="closeBarDetailModal"
      @toggle-wishlist="handleToggleWishlistFromDetail"
    />

    <div
      v-if="googleMapsLoading || (isLoading && !isMapReady)"
      class="loading-overlay"
    >
      <div class="loader"></div>
      <p class="loading-message">載入中，請稍候...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from "vue";
import debounce from "lodash/debounce";

import FilterPanel from "../../components/map/FilterPanel.vue";
import BarList from "../../components/map/BarList.vue";
import BarDetailModal from "../../components/map/BarDetailModal.vue";
import { useGoogleMaps } from "@/composable/useGoogleMaps";


const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const isLoading = ref(false);
const mapContainer = ref(null);
const isFetching = ref(false);
const isMapReady = ref(false); // 標記首次地圖和數據載入完成，取代 firstLoadDone

const {
  map,
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
    // 確保地圖初始化且不是第一次載入才觸發搜索，避免在第一次載入時重複執行
    if (!isLoading.value && isMapReady.value) {
      console.log("Map idle, triggering searchBarsInMapBounds.");
      searchBarsInMapBounds(false); // 不顯示 loading
    }
  },
});

const isFilterPanelOpen = ref(false);
const searchQuery = ref("");
/** @type {import('vue').Ref<Array<object>>} */
const suggestions = ref([]);
/** @type {import('vue').Ref<Array<Bar>>} */
const googleBars = ref([]);
/** @type {import('vue').Ref<BarFilters>} */
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
  openNow: null, // 新增 openNow 屬性
});
/** @type {import('vue').Ref<Bar | null>} */
const selectedBarForDetail = ref(null);
const isBarDetailModalOpen = ref(false);

/** @type {import('vue').Ref<Object.<string, any>>} */
const googlePlaceCache = ref({});

const districtCenters = {
  信義區: { lat: 25.033, lng: 121.5654 },
  大安區: { lat: 25.0268, lng: 121.543 },
  中山區: { lat: 25.0526, lng: 121.5325 },
  松山區: { lat: 25.0505, lng: 121.5747 },
  萬華區: { lat: 25.036, lng: 121.4997 },
  士林區: { lat: 25.0928, lng: 121.5246 },
};

/**
 * @type {import('vue').ComputedRef<Array<Bar>>}
 */
const filteredBars = computed(() => {
  /** @type {Array<Bar>} */
  let bars = googleBars.value;

  if (currentFilters.value.ratingSort !== "any") {
    if (currentFilters.value.ratingSort === "highToLow") {
      bars = [...bars].sort((a, b) => b.rating - a.rating);
    } else if (currentFilters.value.ratingSort === "lowToHigh") {
      bars = [...bars].sort((a, b) => a.rating - b.rating);
    } else if (currentFilters.value.ratingSort === "mostPopular") {
      bars = [...bars].sort(
        (a, b) => (b.user_ratings_total || 0) - (a.user_ratings_total || 0)
      );
    }
  }

  if (
    typeof currentFilters.value.minDistance === "number" &&
    typeof currentFilters.value.maxDistance === "number"
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
        const distance = R * c;
        return (
          distance >= currentFilters.value.minDistance &&
          distance <= currentFilters.value.maxDistance
        );
      });
    }
  }

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

  // 新增篩選：營業狀態
  if (typeof currentFilters.value.openNow === "boolean") {
    if (currentFilters.value.openNow === true) {
      bars = bars.filter((bar) => bar.opening_hours?.open_now === true);
    } else if (currentFilters.value.openNow === false) {
      // 如果開放時間資訊不存在，則認為不營業
      bars = bars.filter(
        (bar) => bar.opening_hours?.open_now === false || !bar.opening_hours
      );
    }
  }

  return bars;
});

/** @type {Array<Bar>} */
let lastDrawnBars = [];
watch(
  filteredBars,
  (newBars) => {
    const newBarIds = newBars
      .map((b) => b.place_id || b.id)
      .sort()
      .join(",");
    const lastDrawnBarIds = lastDrawnBars
      .map((b) => b.place_id || b.id)
      .sort()
      .join(",");

    if (newBarIds !== lastDrawnBarIds) {
      console.log("filteredBars changed, updating map markers.");
      if (map.value) {
        displayBarsOnMap(newBars, handleBarSelected);
        lastDrawnBars = [...newBars];
      }
    } else {
      console.log("filteredBars content unchanged, skipping marker update.");
    }
  },
  { deep: true }
);

const debouncedSearchSuggestions = debounce(async () => {
  if (!searchQuery.value) {
    suggestions.value = [];
    return;
  }
  suggestions.value = await getPlacePredictions(searchQuery.value);
}, 300);

/**
 * @param {object} suggestion
 * @param {string} suggestion.description
 */
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
        console.log("Map idle after search, triggering searchBarsInMapBounds.");
        await searchBarsInMapBounds(true);
        isLoading.value = false;
      });
    } else {
      alert("找不到相關地點，請換個關鍵字");
      isLoading.value = false;
    }
  } catch (err) {
    console.error("搜尋失敗:", err);
    alert("搜尋失敗，請稍後再試");
    isLoading.value = false;
  }
}

async function handleGetCurrentLocation() {
  isLoading.value = true;
  try {
    const sidebarWidth =
      document.querySelector(".bar-list-sidebar")?.offsetWidth || 0;
    await getMapCurrentLocation(sidebarWidth);
    window.google.maps.event.addListenerOnce(map.value, "idle", async () => {
      console.log(
        "Map idle after current location, triggering searchBarsInMapBounds."
      );
      await searchBarsInMapBounds(true);
      isLoading.value = false;
    });
  } catch (err) {
    console.error("獲取目前位置失敗:", err);
    alert("無法獲取您的目前位置，請檢查瀏覽器權限設定。");
    isLoading.value = false;
  }
}

/**
 * @param {BarFilters} filters
 */
function handleFilterChanged(filters) {
  currentFilters.value = { ...filters };

  const targetDistrict = filters.address !== "any" ? filters.address : null;

  if (targetDistrict && districtCenters[targetDistrict]) {
    const { lat, lng } = districtCenters[targetDistrict];
    if (map.value) {
      map.value.setCenter({ lat, lng });
      map.value.setZoom(15);
      window.google.maps.event.addListenerOnce(map.value, "idle", async () => {
        console.log(
          "Map idle after district filter, triggering searchBarsInMapBounds."
        );
        await searchBarsInMapBounds(true);
      });
    } else {
      console.warn(
        "Map not ready for district filter, performing search without map move."
      );
      searchBarsInMapBounds(true);
    }
  } else {
    console.log(
      "No specific district selected, triggering searchBarsInMapBounds."
    );
    searchBarsInMapBounds(true);
  }

  toggleFilterPanel();
}

/**
 * @param {object} payload
 * @param {keyof BarFilters | "distance" | "openHour" | "tags"} payload.type
 * @param {any} payload.value
 */
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
    case "openNow": // 新增移除營業狀態篩選
      currentFilters.value.openNow = null;
      break;
    case "tags":
      currentFilters.value.tags = currentFilters.value.tags.filter(
        (tag) => tag !== value
      );
      break;
  }
  console.log("Filter removed, triggering searchBarsInMapBounds.");
  searchBarsInMapBounds(true);
}

function toggleFilterPanel() {
  isFilterPanelOpen.value = !isFilterPanelOpen.value;
  console.log("isFilterPanelOpen toggled to:", isFilterPanelOpen.value);
  nextTick(() => {
    if (isFilterPanelOpen.value) {
      // 可選：聚焦篩選面板中的第一個輸入框
    }
  });
}

/**
 * @param {boolean} showLoading
 * @returns {Promise<Array<Bar>>}
 */
async function searchBarsInMapBounds(showLoading = false) {
  if (!map.value || !map.value.getBounds()) {
    console.warn("Map not ready for searchBarsInMapBounds, skipping.");
    return [];
  }
  if (isFetching.value) {
    console.log("Already fetching bars, skipping duplicate request.");
    return [];
  }
  isFetching.value = true;
  try {
    const bounds = map.value.getBounds();
    if (!bounds) {
      console.warn("Map bounds are null, skipping searchBarsInMapBounds.");
      return [];
    }
    const center = bounds.getCenter();
    if (!center) {
      console.warn("Map center is null, skipping searchBarsInMapBounds.");
      return [];
    }
    if (showLoading) isLoading.value = true;

    /** @type {Array<Bar>} */
    const newBars = await searchBarsInMapBoundsFromComposable();
    googleBars.value = newBars;

    if (showLoading) isLoading.value = false;
    return newBars;
  } catch (err) {
    console.error("searchBarsInMapBounds error:", err);
    return [];
  } finally {
    isFetching.value = false;
  }
}

/**
 * @param {Bar} bar
 */
async function handleBarSelected(bar) {
  selectedBarForDetail.value = null;
  isBarDetailModalOpen.value = true;

  if (bar.location) {
    panTo(bar.location);
    setZoom(15);
  }

  /** @type {any} */
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
      lat: typeof bar.location.lat === "function" ? bar.location.lat() : bar.location.lat,
      lng: typeof bar.location.lng === "function" ? bar.location.lng() : bar.location.lng,
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
      googleDetail?.opening_hours || bar.openingHours || bar.opening_hours || {},
    opening_hours:
      googleDetail?.opening_hours || bar.openingHours || bar.opening_hours || {},
    description:
      googleDetail?.editorial_summary?.overview || bar.description || "",
    isOpenNow:
      googleDetail?.opening_hours?.open_now !== undefined
        ? googleDetail.opening_hours.open_now
        : null,
  };
  console.log("Selected bar for detail:", selectedBarForDetail.value);
}

function closeBarDetailModal() {
  isBarDetailModalOpen.value = false;
  selectedBarForDetail.value = null;
}

/**
 * @param {string} barId
 */
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

/**
 * @param {string} barId
 */
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
        const sidebarWidth =
          document.querySelector(".bar-list-sidebar")?.offsetWidth || 0;
        await getMapCurrentLocation(sidebarWidth);
      } catch (err) {
        console.warn("自動定位失敗，將以預設中心查詢:", err);
      }
      window.google.maps.event.addListenerOnce(map.value, "idle", async () => {
        console.log(
          "Initial map idle, triggering first searchBarsInMapBounds."
        );
        await searchBarsInMapBounds(true);
        isMapReady.value = true; // 標記地圖已準備好
        requestGeolocationPermission();
        isLoading.value = false;
      });
    } else {
      console.error("錯誤：地圖容器 ref 未綁定，無法初始化地圖。");
      isLoading.value = false;
    }
  } catch (err) {
    console.error("地圖或數據載入失敗:", err);
    alert("初始化失敗，請檢查控制台錯誤。");
    isLoading.value = false;
  }
});
</script>

<style scoped>
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

.map-container {
  flex-grow: 1;
  height: 100%;
  background-color: #e0e0e0;
}

/* 針對 FilterPanel 的樣式調整 */
.filter-panel-overlay {
  position: absolute;
  top: 90px; /* 根據 top-left-controls 的高度和間距調整 */
  left: calc(380px + 20px); /* 保持與 top-left-controls 對齊 */
  z-index: 101; /* 確保在 top-left-controls 之上 */
  background-color: white; /* 確保有背景色，以免內容被穿透 */
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  padding: 20px; /* 根據 FilterPanel 內部內容調整內邊距 */
  width: 350px; /* 設定一個明確的寬度，根據 FilterPanel 設計調整 */
  max-height: calc(
    100vh - 120px
  ); /* 限制高度，防止超出視窗，120px 是 top + bottom margin/padding */
  overflow-y: auto; /* 如果內容超出高度，允許滾動 */
  transform-origin: top left; /* 設置過渡動畫的起點 */
  transition: all 0.3s ease-out; /* 新增過渡動畫 */
}

/* Vue Transition CSS for fade effect (Optional, but good for UX) */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 確保按鈕樣式 */
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
  .filter-panel-overlay {
    left: 20px;
    width: calc(100% - 40px);
  }
}
</style>