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
      v-if="isBarDetailModalOpen"
      :bar="selectedBarForDetail"
      @close="closeBarDetailModal"
      @toggle-wishlist="handleToggleWishlistFromDetail"
    />

    <div v-if="googleMapsLoading || isLoading" class="loading-overlay">
      <div class="loader"></div>
      <p class="loading-message">載入中，請稍候...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import debounce from "lodash/debounce";
import dayjs from "dayjs";

import FilterPanel from "../../components/map/FilterPanel.vue";
import BarList from "../../components/map/BarList.vue";
import BarDetailModal from "../../components/map/BarDetailModal.vue";
import { useGoogleMaps } from "@/composable/useGoogleMaps";

const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const myMapId = import.meta.env.MAP_ID;

const isLoading = ref(false);
const mapContainer = ref(null);

// 引入 useGoogleMaps Composable
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
  searchAndDisplayPlaces,
  panToAndShowBarInfo,
} = useGoogleMaps(mapContainer, {
  googleMapsApiKey: googleMapsApiKey,
  onLoading: () => console.log("Google Maps API 載入中..."),
  mapId: myMapId,
  onLoaded: () => console.log("Google Maps API 載入完成。"),
  onError: (msg) => {
    console.error("useGoogleMaps 錯誤:", msg);
    alert(`地圖載入失敗：${msg}，請檢查API Key或網路。`);
  },
});

const isFilterPanelOpen = ref(false);
const searchQuery = ref("");
const suggestions = ref([]);
const allBars = ref([]);
const currentFilters = ref({
  // 當前篩選條件
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
const selectedBar = ref(null);
const isBarDetailModalOpen = ref(false);
const selectedBarForDetail = ref(null);

// --- 計算屬性 ---
const filteredBars = computed(() => {
  let barsToFilter = [...allBars.value];

  if (currentFilters.value.address !== "any") {
    barsToFilter = barsToFilter.filter((bar) =>
      bar.tags.includes(currentFilters.value.address)
    );
  }


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
  }


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
      const format = "HH:mm";
      let barOpen = dayjs(`${match[1]}:${match[2]}`, format);
      let barClose = dayjs(`${match[3]}:${match[4]}`, format);
      if (barClose.isBefore(barOpen)) {
        barClose = barClose.add(1, "day");
      }
      let filterOpen = dayjs()
        .hour(currentFilters.value.minOpenHour)
        .minute(currentFilters.value.minOpenMinute);
      let filterClose = dayjs()
        .hour(currentFilters.value.maxOpenHour)
        .minute(currentFilters.value.maxOpenMinute);
      if (filterClose.isBefore(filterOpen)) {
        filterClose = filterClose.add(1, "day");
      }
      return barOpen.isBefore(filterClose) && barClose.isAfter(filterOpen);
    });
  }


  if (currentFilters.value.ratingSort === "highToLow") {
    barsToFilter.sort((a, b) => b.rating - a.rating);
  } else if (currentFilters.value.ratingSort === "lowToHigh") {
    barsToFilter.sort((a, b) => a.rating - b.rating);
  }


  if (currentFilters.value.tags && currentFilters.value.tags.length > 0) {
    barsToFilter = barsToFilter.filter((bar) =>
      currentFilters.value.tags.every((tag) => bar.tags.includes(tag))
    );
  }

  return barsToFilter;
});

// --- 事件處理函式 ---
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
  await searchAndDisplayPlaces(searchQuery.value);
}

async function handleGetCurrentLocation() {
  isLoading.value = true;
  try {
    await getMapCurrentLocation(
      document.querySelector(".bar-list-sidebar")?.offsetWidth || 0
    );
  } catch (err) {
    console.error("獲取目前位置失敗:", err);
    alert("無法獲取您的目前位置，請檢查瀏覽器權限設定。");
  } finally {
    isLoading.value = false;
  }
}

function handleFilterChanged(filters) {
  currentFilters.value = filters;
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

function handleBarSelected(bar) {
  selectedBar.value = bar;
  selectedBarForDetail.value = bar;
  isBarDetailModalOpen.value = true;
  panToAndShowBarInfo(bar);
}

function closeBarDetailModal() {
  isBarDetailModalOpen.value = false;
  selectedBarForDetail.value = null;
  closeInfoWindow();
}

function handleToggleWishlist(barId) {
  const barIndex = allBars.value.findIndex((b) => b.id === barId);
  if (barIndex > -1) {
    allBars.value[barIndex].isWishlisted =
      !allBars.value[barIndex].isWishlisted;
  }
  if (selectedBarForDetail.value && selectedBarForDetail.value.id === barId) {
    selectedBarForDetail.value.isWishlisted =
      !selectedBarForDetail.value.isWishlisted;
  }
}

const handleToggleWishlistFromDetail = (barId) => {
  handleToggleWishlist(barId);
};

// 模擬獲取酒吧數據
function fetchBarsData() {
  allBars.value = [
    {
      id: "b001",
      place_id: "ChIJ7-02o96jQjQR6c8b9j01314",
      name: "微醺角落",
      location: { lat: 25.0478, lng: 121.5172 },
      rating: 4.5,
      reviews: 120,
      priceRange: "300-600",
      tags: ["精釀啤酒", "放鬆氛圍", "平價", "中山區"],
      openingHours: { weekday_text: ["週二至週日 18:00 - 01:00"] },
      imageUrl: "",
      description: "隱身巷弄中的小酒館，提供多款精釀啤酒，適合下班小酌。",
      isWishlisted: false,
      images: [],
      address: "台北市中山區某某街123號",
      phone: "02-1234-5678",
      website: "https://www.example.com/bar001",
    },
    {
      id: "b002",
      place_id: "ChIJY52JzdyjQjQR6c8b9j01314",
      name: "信義夜景酒吧",
      location: { lat: 25.0336, lng: 121.5644 },
      rating: 4.8,
      reviews: 350,
      priceRange: "800-1500",
      tags: ["高空美景", "創意調酒", "約會小酌", "信義區"],
      openingHours: { weekday_text: ["每日 20:00 - 02:00"] },
      imageUrl: "",
      description: "俯瞰台北市夜景的絕佳地點，提供精緻調酒與餐點，是約會首選。",
      isWishlisted: false,
      images: [],
      address: "台北市信義區某某路456號",
      phone: "02-9876-5432",
      website: "https://www.example.com/bar002",
    },
    {
      id: "b003",
      place_id: "ChIJX52JzdyjQjQR6c8b9j01314",
      name: "大安運動酒吧",
      rating: 4.2,
      reviews: 200,
      priceRange: "400-900",
      openingHours: { weekday_text: ["每日 17:00 - 03:00"] },
      description: "提供多台大型螢幕轉播運動賽事，氛圍熱烈，適合與朋友一起看球",
      tags: ["運動酒吧", "大型螢幕", "觀賽熱點", "美式", "大安區"],
      imageUrl: "",
      location: { lat: 25.038, lng: 121.543 },
      isWishlisted: false,
      images: [],
      address: "台北市大安區某某街789號",
      phone: "02-1122-3344",
      website: "",
    },
    {
      id: "b004",
      place_id: "ChIJL52JzdyjQjQR6c8b9j01314",
      name: "松山爵士吧",
      location: { lat: 25.0505, lng: 121.5501 },
      rating: 4.7,
      reviews: 80,
      priceRange: "600-1200",
      tags: ["爵士樂", "現場表演", "復古", "調酒", "松山區"],
      openingHours: { weekday_text: ["週三至週日 20:30 - 01:30"] },
      imageUrl: "",
      description: "每晚有現場爵士樂表演，提供多款經典調酒，適合品味人士。",
      isWishlisted: false,
      images: [],
      address: "台北市松山區某某路100號",
      phone: "02-5566-7788",
      website: "https://www.example.com/bar004",
    },
    {
      id: "b005",
      place_id: "ChIJQ52JzdyjQjQR6c8b9j01314",
      name: "萬華老屋酒吧",
      location: { lat: 25.0375, lng: 121.5036 },
      rating: 4.3,
      reviews: 95,
      priceRange: "350-700",
      tags: ["老屋改造", "復古", "特色", "小酌", "萬華區"],
      openingHours: { weekday_text: ["週一至週六 19:00 - 00:00"] },
      imageUrl: "",
      description: "由老屋改造的特色酒吧，保留復古元素，提供獨特調酒。",
      isWishlisted: false,
      images: [],
      address: "台北市萬華區某某街1號",
      phone: "",
      website: "",
    },
    {
      id: "b006",
      place_id: "ChIJL52JzdyjQjQR6c8b9j01314",
      name: "士林文青酒吧",
      location: { lat: 25.0935, lng: 121.5235 },
      rating: 4.6,
      reviews: 150,
      priceRange: "450-800",
      tags: ["文青", "咖啡", "輕食", "獨立", "士林區"],
      openingHours: { weekday_text: ["週二至週日 14:00 - 23:00"] },
      imageUrl: "",
      description: "結合咖啡與酒精，氛圍輕鬆，適合閱讀或安靜小酌。",
      isWishlisted: false,
      images: [],
      address: "台北市士林區某某街20號",
      phone: "02-1234-9876",
      website: "https://www.example.com/bar006",
    },
    {
      id: "b007",
      place_id: "ChIJZ52JzdyjQjQR6c8b9j01314",
      name: "信義餐酒館",
      location: { lat: 25.041, lng: 121.567 },
      rating: 4.9,
      reviews: 90,
      priceRange: "700-1300",
      tags: ["秘密基地", "私密空間", "預約制", "信義區"],
      openingHours: { weekday_text: ["週三至週六 21:00 - 03:00"] },
      imageUrl: "",
      description: "隱藏在城市中的秘密酒吧，需要預約才能進入，提供客製化調酒。",
      isWishlisted: false,
      images: [],
      address: "台北市信義區某某街33號",
      phone: "0912-345-678",
      website: "",
    },
    {
      id: "b008",
      place_id: "ChIJG52JzdyjQjQR6c8b9j01314",
      name: "大安居酒屋",
      location: { lat: 25.037, lng: 121.545 },
      rating: 4.4,
      reviews: 250,
      priceRange: "500-1000",
      tags: ["居酒屋", "日式", "燒烤", "深夜食堂", "大安區"],
      openingHours: { weekday_text: ["每日 18:00 - 00:00"] },
      imageUrl: "",
      description: "提供地道日式居酒屋氛圍，美味串燒與多種清酒。",
      isWishlisted: false,
      images: [],
      address: "台北市大安區某某路88號",
      phone: "02-7788-9900",
      website: "https://www.example.com/bar008",
    },
  ];
}

onMounted(async () => {
  isLoading.value = true;
  try {
    await loadGoogleMapsAPI();
    if (mapContainer.value) {
      initMap();
      fetchBarsData();
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

// 監聽篩選後的酒吧列表，更新地圖上的標記
watch(
  filteredBars,
  (newBars) => {
    if (map.value) {
      displayBarsOnMap(newBars);
    } else {
      console.warn("地圖實例尚未準備好，無法顯示酒吧標記。");
    }
  },
  { immediate: true }
);

// 監聽選中的酒吧，並在地圖上顯示其資訊視窗 (僅當詳細頁面未打開時)
watch(selectedBar, (newVal) => {
  if (newVal && map.value && !isBarDetailModalOpen.value) {
  } else if (!isBarDetailModalOpen.value) {
    closeInfoWindow();
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

.map-container {
  flex-grow: 1;
  height: 100%;
  background-color: #e0e0e0;
}

/* --- 載入中遮罩 --- */
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