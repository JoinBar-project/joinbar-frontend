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
  searchAndDisplayPlaces,
  panToAndShowBarInfo,
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
const selectedBar = ref(null); // 這用於地圖上的 infoWindow
const isBarDetailModalOpen = ref(false); // 新增：控制酒吧詳細頁面的顯示
const selectedBarForDetail = ref(null); // 新增：儲存要顯示在詳細頁面的酒吧數據

// ----------------------------------------------------------------------
// 計算屬性
// ----------------------------------------------------------------------

// 根據篩選條件過濾酒吧列表
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
          // computeDistanceBetween 返回的是米，需要轉換為公里或保持一致
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
      const format = "HH:mm";
      let barOpen = dayjs(`${match[1]}:${match[2]}`, format);
      let barClose = dayjs(`${match[3]}:${match[4]}`, format);
      if (barClose.isBefore(barOpen)) {
        barClose = barClose.add(1, "day"); // 跨日
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
      // 判斷時間區間是否有重疊
      return barOpen.isBefore(filterClose) && barClose.isAfter(filterOpen);
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

// 修改 handleBarSelected，現在它會打開詳細頁面
function handleBarSelected(bar) {
  selectedBar.value = bar; // 這個是給地圖 infoWindow 用的
  selectedBarForDetail.value = bar; // 這個是給詳細頁面用的
  isBarDetailModalOpen.value = true; // 開啟詳細頁面
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
  const barIndex = allBars.value.findIndex((b) => b.id === barId);
  if (barIndex > -1) {
    allBars.value[barIndex].isWishlisted =
      !allBars.value[barIndex].isWishlisted;
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

// 模擬獲取酒吧數據 (實際專案應替換為 API 請求)
// **此函數現在只負責填充 allBars，不負責載入狀態**
function fetchBarsData() {
  // 這裡只負責獲取數據，isLoading 由 MapView 負責管理
  // 假設數據是同步返回，如果異步則需要 await
  allBars.value = [
    {
      id: "b001",
      place_id: "ChIJ7-02o96jQjQR6c8b9j01314", // 為了收藏功能，需要一個 place_id
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
      images: [
        "https://images.unsplash.com/photo-1543007137-b715ee51102b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1543007137-b715ee51102b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1543007137-b715ee51102b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      ],
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
      imageUrl:
        "https://images.unsplash.com/photo-1582855171120-6d80f837e2c9?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      description: "俯瞰台北市夜景的絕佳地點，提供精緻調酒與餐點，是約會首選。",
      isWishlisted: false,
      images: [
        "https://images.unsplash.com/photo-1582855171120-6d80f837e2c9?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1582855171120-6d80f837e2c9?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      ],
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
      imageUrl:
        "https://images.unsplash.com/photo-1543007137-b715ee51102b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      location: { lat: 25.038, lng: 121.543 },
      isWishlisted: false,
      images: [
        "https://images.unsplash.com/photo-1543007137-b715ee51102b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      ],
      address: "台北市大安區某某街789號",
      phone: "02-1122-3344",
      website: "",
    },
    {
      id: "b004",
      place_id: "ChIJR52JzdyjQjQR6c8b9j01314",
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
      images: [
        "https://images.unsplash.com/photo-1620857106093-6c7e39a3f25c?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      ],
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
      imageUrl:
        "https://images.unsplash.com/photo-1567119054760-449e6d0a794c?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      description: "由老屋改造的特色酒吧，保留復古元素，提供獨特調酒。",
      isWishlisted: false,
      images: [
        "https://images.unsplash.com/photo-1567119054760-449e6d0a794c?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      ],
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
      imageUrl:
        "https://images.unsplash.com/photo-1624467362791-0391d84e4f58?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      description: "結合咖啡與酒精，氛圍輕鬆，適合閱讀或安靜小酌。",
      isWishlisted: false,
      images: [
        "https://images.unsplash.com/photo-1624467362791-0391d84e4f58?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      ],
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
      imageUrl:
        "https://images.unsplash.com/photo-1517409259508-3331b262a048?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      description: "隱藏在城市中的秘密酒吧，需要預約才能進入，提供客製化調酒。",
      isWishlisted: false,
      images: [
        "https://images.unsplash.com/photo-1517409259508-3331b262a048?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      ],
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
      imageUrl:
        "https://images.unsplash.com/photo-1549429402-d96201e523f4?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      description: "提供地道日式居酒屋氛圍，美味串燒與多種清酒。",
      isWishlisted: false,
      images: [
        "https://images.unsplash.com/photo-1549429402-d96201e523f4?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      ],
      address: "台北市大安區某某路88號",
      phone: "02-7788-9900",
      website: "https://www.example.com/bar008",
    },
  ];
  // 這裡不設置 isLoading.value = false; 因為地圖的載入狀態由 useGoogleMaps 管理
}

// ----------------------------------------------------------------------
// Vue 生命週期與監聽器
// ----------------------------------------------------------------------

onMounted(async () => {
  isLoading.value = true; // 開始載入所有非地圖相關數據
  try {
    await loadGoogleMapsAPI();
    console.log("Google Maps API 載入完成，準備初始化地圖...");

    if (mapContainer.value) {
      initMap();
      console.log("地圖初始化完成。");

      fetchBarsData();
      console.log("所有酒吧數據已載入:", allBars.value);

      // 請求地理定位權限
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
    console.log("filteredBars 變化，準備在地圖上顯示標記:", newBars);
    // 確保地圖實例存在，才執行標記顯示
    if (map.value) {
      displayBarsOnMap(newBars);
    } else {
      // 可以在這裡加載狀態或提示
      console.warn("地圖實例尚未準備好，無法顯示酒吧標記。");
    }
  },
  { immediate: true } // 立即執行一次，確保初始數據的標記顯示
);

// 監聽選中的酒吧，並在地圖上顯示其資訊視窗
// 此 watch 現在只負責地圖上的 infoWindow，不直接控制詳細頁面
watch(selectedBar, (newVal) => {
  if (newVal && map.value && !isBarDetailModalOpen.value) {
    // 只有當詳細頁面沒有打開時，才顯示地圖上的 infoWindow
    // panToAndShowBarInfo(newVal); // 這裡由 handleBarSelected 調用
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
