<template>
  <div class="map-view-container">
    <div class="top-left-controls">
      <button
        class="filter-toggle-button map-control-button"
        @click="toggleFilterPanel"
      >
        <i class="fas fa-cog"></i> 篩選
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
        </div>
      </div>

      <button @click="handleSearch" class="btn search-bt map-control-button">
        <b>🔍 搜尋</b>
      </button>

      <button
        @click="handleGetCurrentLocation"
        class="place-now-map map-control-button"
      >
        <b>📍 顯示我目前位置</b>
      </button>
    </div>

    <aside class="bar-list-sidebar">
      <div class="sidebar-header">
        <h1 class="app-title">JoinBar</h1>
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

    <div v-if="isLoading || googleMapsLoading" class="loading-overlay">
      <div class="loader"></div>
      <p class="loading-message">載入中，請稍候...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, shallowRef } from "vue";
import debounce from "lodash/debounce";

// 1. 引入你的組件
import FilterPanel from "@/components/FilterPanel.vue";
// BarList 已移除

import { useGoogleMaps } from "@/composable/useGoogleMaps";

// 確保 API Key 存在
const googleMapsApiKey = import.meta.env.VITE_MAPS_API_KEY;
if (!googleMapsApiKey) {
  console.error("VITE_MAPS_API_KEY is not defined in environment variables.");
}

const isLoading = ref(false);
const mapContainer = ref(null);

const {
  map,
  markers,
  searchMarkers,
  infoWindow,
  currentMarker,
  loading: googleMapsLoading,
  error: googleMapsError,
  loadGoogleMapsAPI,
  initMap,
  clearMarkers,
  showInfoWindow,
  closeInfoWindow,
  panTo,
  setZoom,
  fitBounds,
  displayBarsOnMap,
  requestGeolocationPermission,
  getCurrentLocation: getMapCurrentLocation,
  getPlacePredictions,
  searchAndDisplayPlaces,
} = useGoogleMaps(mapContainer, {
  googleMapsApiKey: googleMapsApiKey,
  onLoading: () => {
    isLoading.value = true;
  },
  onLoaded: () => {
    isLoading.value = false;
  },
  onError: (msg) => {
    console.error("useGoogleMaps error:", msg);
    isLoading.value = false;
  },
});

const isFilterPanelOpen = ref(false);
const searchQuery = ref("");
const suggestions = ref([]);

// allBars 仍然保留，用於篩選和在地圖上顯示
const allBars = ref([]);
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

// selectedBar 和 handleBarSelected 已移除

// ----------------------------------------------------------------------
// Computed Properties
// ----------------------------------------------------------------------

const filteredBars = computed(() => {
  let barsToFilter = [...allBars.value];

  // 地址篩選 (如果 'address' 指的是標籤)
  if (currentFilters.value.address !== "any") {
    barsToFilter = barsToFilter.filter((bar) =>
      bar.tags.includes(currentFilters.value.address)
    );
  }

  // 距離篩選
  const mapCenter = map.value?.getCenter();
  if (mapCenter && window.google?.maps?.geometry?.spherical) {
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
        bar.distance =
          window.google.maps.geometry.spherical.computeDistanceBetween(
            centerLatLng,
            barLatLng
          );
        return bar;
      })
      .filter((bar) => {
        return (
          bar.distance !== undefined &&
          bar.distance >= currentFilters.value.minDistance &&
          bar.distance <= currentFilters.value.maxDistance
        );
      });
  }

  // 營業時間篩選
  if (
    currentFilters.value.minOpenHour !== 0 ||
    currentFilters.value.minOpenMinute !== 0 ||
    currentFilters.value.maxOpenHour !== 24 ||
    currentFilters.value.maxOpenMinute !== 0
  ) {
    barsToFilter = barsToFilter.filter((bar) => {
      const openHoursStr =
        bar.openingHours?.weekday_text?.[0] || "";
      const match = openHoursStr.match(/(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})/);

      if (!match) return false;

      let barOpenMinutes = parseInt(match[1]) * 60 + parseInt(match[2]);
      let barCloseMinutes = parseInt(match[3]) * 60 + parseInt(match[4]);

      if (barCloseMinutes < barOpenMinutes) {
        barCloseMinutes += 24 * 60;
      }

      const filterMinMinutes = currentFilters.value.minOpenHour * 60 + currentFilters.value.minOpenMinute;
      let filterMaxMinutes = currentFilters.value.maxOpenHour * 60 + currentFilters.value.maxOpenMinute;

      if (currentFilters.value.maxOpenHour === 24 && currentFilters.value.maxOpenMinute === 0) {
        filterMaxMinutes = 24 * 60;
      }

      if (filterMaxMinutes < filterMinMinutes) {
        filterMaxMinutes += 24 * 60;
      }

      return Math.max(barOpenMinutes, filterMinMinutes) < Math.min(barCloseMinutes, filterMaxMinutes);
    });
  }

  // 評分排序
  if (currentFilters.value.ratingSort === "highest") {
    barsToFilter.sort((a, b) => b.rating - a.rating);
  } else if (currentFilters.value.ratingSort === "lowest") {
    barsToFilter.sort((a, b) => a.rating - b.rating);
  } else if (currentFilters.value.ratingSort === "mostPopular") {
    // 這裡需要根據你的 "近期最受歡迎" 定義來排序
    // 例如，可以根據 reviews 數量，或者另外的熱門指數
    // 由於你的模擬數據中沒有 "近期" 相關的時間戳，這裡暫時可以將它視為按 reviews 數量排序
    barsToFilter.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
  }
  
  // 標籤篩選
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
  await handleSearch(); // 選擇建議後直接執行搜尋
}

async function handleSearch() {
  if (!searchQuery.value) {
    alert("請輸入搜尋關鍵字");
    return;
  }
  // 直接呼叫 Composable 內的高階搜尋函式
  await searchAndDisplayPlaces(searchQuery.value);
}

async function handleGetCurrentLocation() {
  isLoading.value = true;
  try {
    // 呼叫 Composable 中的 getCurrentLocation，並傳入側邊欄寬度
    await getMapCurrentLocation(
      document.querySelector(".bar-list-sidebar")?.offsetWidth || 0
    );
  } catch (err) {
    console.error("獲取目前位置失敗:", err);
  } finally {
    isLoading.value = false;
  }
}

// 處理 FilterPanel 發出的 'filter-changed' 事件
function handleFilterChanged(filters) {
  console.log("接收到篩選條件:", filters);
  currentFilters.value = filters;
}
// 在這裡新增 handleRemoveAppliedFilter 方法
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
    default:
      console.warn("未知篩選類型:", type);
  }
  // 因為直接修改了 currentFilters.value，watch 會自動觸發 filteredBars 的更新
  // FilterPanel 會通過 watch(props.initialFilters) 自動同步其狀態
}

// 切換 FilterPanel 的顯示狀態
function toggleFilterPanel() {
  isFilterPanelOpen.value = !isFilterPanelOpen.value;
}

// handleBarSelected 和 handleToggleWishlist 已移除

// 模擬從後端獲取酒吧數據 (保留，因為地圖仍需要顯示酒吧)
function fetchBars() {
  isLoading.value = true;
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
  isLoading.value = false;
}

// ----------------------------------------------------------------------
// Vue 生命週期與監聽器
// ----------------------------------------------------------------------

onMounted(async () => {
  isLoading.value = true;
  try {
    await loadGoogleMapsAPI();
    initMap();
    fetchBars();
    requestGeolocationPermission();
  } catch (err) {
    console.error("地圖或數據載入失敗：", err);
  } finally {
    isLoading.value = false;
  }
});

// 監聽篩選後的酒吧列表，更新地圖上的標記
watch(
  filteredBars,
  (newBars) => {
    if (map.value) {
      // 這裡現在會顯示 filteredBars 中的酒吧標記，而不是選中的單一酒吧
      clearMarkers('bar'); // 清除現有的酒吧標記
      clearMarkers('search'); // 確保搜尋結果標記也被清除
      closeInfoWindow(); // 關閉任何開啟的資訊視窗
      displayBarsOnMap(newBars); // 呼叫 Composable 新增的函式來顯示篩選後的酒吧
    }
  },
  { immediate: true }
);

// 監聽 selectedBar 的邏輯已移除
</script>

<style scoped>
/* 保持你的 CSS 樣式不變 */
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

.sidebar-header {
  padding: 1.5rem 1rem 1rem;
  background-color: #fff;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  z-index: 10;
}

.app-title {
  font-size: 1.8rem;
  font-weight: bold;
  color: #860914;
  margin: 0;
}

.map-control-button {
  padding: 0.75rem 1.25rem;
  border: none;
  background-color: #decdd5;
  color: #333;
  border-radius: 0.5rem;
  font-size: 1rem;
  cursor: pointer;
  white-space: nowrap;
  font-weight: bold;
  transition:
    background-color 0.2s,
    transform 0.2s;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.map-control-button:hover {
  background-color: #a08d7a;
  transform: translateY(-2px);
}

.filter-toggle-button {
  order: 1;
}

.search-panel-map {
  order: 2;
  display: flex;
  position: relative;
  width: 300px;
  flex-shrink: 1;
}

.input-group {
  display: flex;
  position: relative;
  width: 100%;
}

.search-input {
  height: 40px;
  padding: 8px 12px;
  font-size: 1rem;
  border: 1px solid #decdd5;
  border-radius: 0.5rem;
  outline: none;
  flex: 1;
  color: #333;
}

.search-input:focus {
  border-color: #b8a28e;
  box-shadow: 0 0 0 2px rgba(184, 162, 142, 0.2);
}

.search-bt {
  order: 3;
}

.place-now-map {
  order: 4;
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
  border-radius: 0.5rem;
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
  font-size: 1.4rem;
  font-weight: bold;
  margin-bottom: 8px;
  color: #2c3e50;
  line-height: 1.3;
}

.info-window-meta {
  font-size: 0.95rem;
  color: #555;
  margin-bottom: 5px;
}

.info-window-description {
  font-size: 0.85rem;
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
  font-size: 0.8rem;
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
  padding: 1rem;
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

.remove-filter-button:hover {
  opacity: 1;
}
</style>