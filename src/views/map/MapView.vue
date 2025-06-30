<template>
  <div class="relative flex w-screen h-screen overflow-hidden">
    <div class="mobile-top-controls md:hidden absolute top-0 left-0 right-0 z-[100] bg-white shadow-md">
      <div class="flex items-center justify-between p-3">
        <button
          class="filter-toggle-button mobile-control-button"
          @click="toggleFilterPanel"
        >
          <i class="fas fa-filter"></i>
        </button>
        
        <div class="flex-1 mx-3">
          <div class="search-panel-mobile" ref="searchInputRef">
            <div class="input-group-mobile">
              <input
                type="text"
                id="searchInput"
                class="search-input-mobile"
                v-model="searchQuery"
                placeholder="搜尋地點..."
                @input="debouncedSearchSuggestions"
              />
              <button
                @click="handleSearch"
                class="search-button-mobile"
                :disabled="!isReady"
              >
                <i class="fas fa-search"></i>
              </button>
            </div>
            <ul v-if="suggestions.length" class="suggestions-list-mobile">
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
        
        <button
          @click="handleGetCurrentLocation"
          class="location-button-mobile mobile-control-button"
        >
          <i class="fas fa-location-arrow"></i>
        </button>
      </div>
    </div>

    <div class="desktop-top-controls hidden md:flex absolute top-5 left-[400px] z-[100] flex-row flex-wrap items-center gap-[10px] p-[15px] bg-white/90 rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.2)] transition-[left] duration-300 ease-in-out">
      <button
        class="filter-toggle-button map-control-button"
        @click="toggleFilterPanel"
      >
        <i class="fas fa-filter"></i>
      </button>

      <div class="search-panel-map">
        <div class="input-group" ref="searchInputRef">
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

    <aside :class="['bar-list-sidebar', { 'sidebar-mobile-hidden': !showSidebarOnMobile }]">
      <div class="mobile-sidebar-header md:hidden">
        <div class="flex items-center justify-between p-4 bg-white border-b">
          <h3 class="text-lg font-bold">酒吧列表</h3>
          <button
            @click="toggleMobileSidebar"
            class="text-gray-500 hover:text-gray-700"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
      
      <div class="flex-grow p-4 overflow-y-auto">
        <BarList
          :bars="filteredBars"
          @bar-selected="handleBarSelected"
          @toggle-wishlist="handleToggleWishlist"
        />
      </div>
    </aside>

    <div class="mobile-bottom-toggle md:hidden absolute bottom-4 left-4 z-[100]">
      <button
        @click="toggleMobileSidebar"
        class="p-3 bg-white border rounded-full shadow-lg"
      >
        <div class="flex items-center gap-2">
          <i class="fas fa-list"></i>
          <span class="text-sm font-medium">酒吧列表</span>
          <span class="px-2 py-1 text-xs text-white bg-blue-500 rounded-full">
            {{ filteredBars.length }}
          </span>
        </div>
      </button>
    </div>

    <div ref="mapContainer" :class="['map-container', { 'map-fullscreen': !showSidebarOnMobile }]"></div>

    <FilterPanel
      v-if="isFilterPanelOpen"
      @filter-changed="handleFilterChanged"
      @close-panel="toggleFilterPanel"
      @tag-click="handleTagClick"
      :initial-filters="currentFilters"
      :selected-tag="selectedTag"
      :class="{ 'filter-panel-mobile': isMobile }"
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
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from "vue";
import debounce from "lodash/debounce";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
dayjs.extend(isBetween);

import { useRoute, useRouter } from "vue-router";
const route = useRoute();
const router = useRouter();

import FilterPanel from "../../components/map/FilterPanel.vue";
import BarList from "../../components/map/BarList.vue";
import BarDetailModal from "../../components/map/BarDetailModal.vue";

import { useGoogleMaps } from "@/composables/useGoogleMaps/userIndex.js";
import {
  COMMON_PLACE_TYPES_TO_EXCLUDE,
  BAR_PLACE_TYPES,
} from "@/composables/googleMapsConstants";

const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const myMapId = import.meta.env.VITE_MAP_ID;

const mapContainer = ref(null);

// 響應式設計相關
const showSidebarOnMobile = ref(false);
const isMobile = ref(false);

// 檢測設備類型
const checkDeviceType = () => {
  isMobile.value = window.innerWidth < 768;
  if (!isMobile.value) {
    showSidebarOnMobile.value = true; // 桌面版始終顯示側邊欄
  } else {
    showSidebarOnMobile.value = false; // 手機版預設隱藏側邊欄
  }
};

const toggleMobileSidebar = () => {
  showSidebarOnMobile.value = !showSidebarOnMobile.value;
};

// 原有的所有邏輯保持不變...
const {
  map,
  infoWindow,
  loading: googleMapsLoading,
  isFetching,
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
  searchBarsInMapBounds,
  clearMarkers,
  google: googleMapsInstance,
  isReady,
  formatBarInfoWindowContent,
  getPlaceDetails,
} = useGoogleMaps(mapContainer, {
  googleMapsApiKey: googleMapsApiKey,
  mapId: myMapId,
  onError: (msg) => {
    console.error("useGoogleMaps 錯誤:", msg);
    alert(`地圖載入失敗：${msg}。`);
  },
});

// 保留所有原有的 ref 和 computed
const isFilterPanelOpen = ref(false);
const searchQuery = ref("");
const suggestions = ref([]);
const currentFilters = ref({
  address: "current_location",
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
const isLoading = ref(false);
const googleBars = ref([]);
const searchInputRef = ref(null);
const mainBarForSearch = ref(null);
const selectedTag = ref(null);

const combinedLoading = computed(
  () => googleMapsLoading.value || isFetching.value || isLoading.value
);

const filteredBars = computed(() => {
  // 保留原有的篩選邏輯...
  let bars = googleBars.value || [];
  if (!Array.isArray(bars)) bars = [];
  const filters = currentFilters.value;

  // 過濾評分
  if (filters.ratingSort !== "any") {
    bars = bars.filter((bar) => {
      if (filters.ratingSort === "above_4" && bar.rating < 4) return false;
      if (filters.ratingSort === "above_3" && bar.rating < 3) return false;
      return true;
    });
  }

  // 過濾營業時間
  if (
    filters.minOpenHour !== 0 ||
    filters.minOpenMinute !== 0 ||
    filters.maxOpenHour !== 24 ||
    filters.maxOpenMinute !== 0
  ) {
    const now = dayjs();
    const currentDay = now.day(); // 0 = 星期日, 6 = 星期六

    bars = bars.filter((bar) => {
      if (!bar.opening_hours || !bar.opening_hours.periods) {
        return false; // 如果沒有營業時間資訊，則不顯示
      }

      const openTime = dayjs()
        .hour(filters.minOpenHour)
        .minute(filters.minOpenMinute);
      const closeTime = dayjs()
        .hour(filters.maxOpenHour)
        .minute(filters.maxOpenMinute);

      // 檢查是否在營業時間內
      const isOpenNow = bar.opening_hours.isOpen();
      if (!isOpenNow) return false;

      // 細化到今天的營業時間段
      const periodsToday = bar.opening_hours.periods.filter((period) => {
        return (
          period.open &&
          period.open.day === currentDay &&
          (!period.close || period.close.day === currentDay)
        );
      });

      if (periodsToday.length === 0) {
        return false; // 今天沒有營業時間
      }

      // 檢查是否符合使用者選定的時間範圍
      return periodsToday.some((period) => {
        const periodOpenHour = Math.floor(period.open.time / 100);
        const periodOpenMinute = period.open.time % 100;
        const periodOpen = dayjs().hour(periodOpenHour).minute(periodOpenMinute);

        let periodClose = null;
        if (period.close) {
          const periodCloseHour = Math.floor(period.close.time / 100);
          const periodCloseMinute = period.close.time % 100;
          periodClose = dayjs().hour(periodCloseHour).minute(periodCloseMinute);

          // 處理跨天的情況 (例如 22:00 - 02:00)
          if (periodClose.isBefore(periodOpen)) {
            periodClose = periodClose.add(1, "day");
          }
        } else {
          // 如果沒有關閉時間，表示營業到深夜或24小時
          periodClose = dayjs().endOf("day").add(1, "day"); // 視為營業到隔天
        }

        // 檢查使用者選擇的開放時間是否在酒吧的營業時間內
        const userOpenTimeWithinPeriod = openTime.isBetween(
          periodOpen,
          periodClose,
          null,
          "[)"
        ); // [起始時間, 結束時間)
        const userCloseTimeWithinPeriod = closeTime.isBetween(
          periodOpen,
          periodClose,
          null,
          "(]"
        ); // (起始時間, 結束時間]

        // 檢查酒吧營業時間是否包含使用者選擇的時間段
        const periodCoversUserRange =
          periodOpen.isSameOrBefore(openTime) &&
          periodClose.isSameOrAfter(closeTime);

        return (
          userOpenTimeWithinPeriod ||
          userCloseTimeWithinPeriod ||
          periodCoversUserRange
        );
      });
    });
  }

  // 過濾標籤
  if (filters.tags && filters.tags.length > 0) {
    bars = bars.filter((bar) => {
      return filters.tags.every((tag) => bar.tags.includes(tag));
    });
  }

  const result = [];
  if (mainBarForSearch.value) {
    const isMainBarInFiltered = bars.some(
      (bar) => bar.place_id === mainBarForSearch.value.place_id
    );
    if (!isMainBarInFiltered) {
      result.push(mainBarForSearch.value);
    }
  }
  result.push(...bars);
  return result;
});

// 保留所有原有的方法...
const debouncedSearchSuggestions = debounce(async () => {
  if (!searchQuery.value) {
    suggestions.value = [];
    return;
  }
  suggestions.value = await getPlacePredictions(searchQuery.value);
}, 300);

// 所有其他方法保持不變...
async function selectSuggestion(suggestion) {
  searchQuery.value = suggestion.description;
  suggestions.value = [];
  handleSearch();
  isLoading.value = true;
  clearMarkers("all");
  closeInfoWindow();
  try {
    const detail = await getPlaceDetails(suggestion.place_id);
    if (detail && detail.geometry && detail.geometry.location) {
      const barDetail = {
        id: detail.place_id,
        place_id: detail.place_id,
        name: detail.name,
        location: {
          lat: detail.geometry.location.lat(),
          lng: detail.geometry.location.lng(),
        },
        rating: detail.rating || 0,
        reviews: detail.user_ratings_total || 0,
        address: detail.formatted_address || "未知地址",
        priceRange:
          detail.price_level !== undefined
            ? `等級 ${detail.price_level}`
            : null,
        tags: detail.types
          ? detail.types.filter(
              (type) => !COMMON_PLACE_TYPES_TO_EXCLUDE.includes(type)
            )
          : [],
        opening_hours: detail.opening_hours,
        imageUrl:
          detail.photos && detail.photos.length > 0
            ? detail.photos[0].getUrl({ maxWidth: 400, maxHeight: 400 })
            : "",
        images: detail.photos
          ? detail.photos.map((p) =>
              p.getUrl({ maxWidth: 800, maxHeight: 600 })
            )
          : [],
        description: "點擊查看更多詳情...",
        isWishlisted: false,
        phone: detail.international_phone_number || null,
        website: detail.website || null,
        url: detail.url,
        googleReviews: detail.reviews || [],
      };
      mainBarForSearch.value = barDetail;
      googleBars.value = [barDetail];
      displayBarsOnMap([barDetail], formatBarInfoWindowContent);
      panTo(detail.geometry.location);
    } else {
      alert("無法獲取選定地點的詳細資訊。");
    }
  } catch (error) {
    alert("獲取地點詳細資訊失敗，請重試。");
  } finally {
    isLoading.value = false;
  }
}

async function handleSearch() {
  suggestions.value = [];
  if (!isReady.value) {
    alert("地圖尚未載入完成，請稍候再試");
    return;
  }
  if (!searchQuery.value) {
    alert("請輸入搜尋關鍵字");
    return;
  }
  isLoading.value = true;
  clearMarkers("all");
  closeInfoWindow();
  try {
    let mainBars = [];
    let typeForNearby = "establishment"; // 預設搜尋類型
    const q = searchQuery.value.trim().toLowerCase();

    // 根據關鍵字判斷搜尋類型
    if (
      ["bar", "酒吧", "pub", "night club", "夜店", "交易吧", "intention"].some(
        (k) => q.includes(k)
      )
    ) {
      typeForNearby = ["bar", "night_club", "pub", "liquor_store"];
    } else if (
      ["小吃", "餐廳", "美食", "food", "restaurant", "吃飯", "吃吃"].some((k) =>
        q.includes(k)
      )
    ) {
      typeForNearby = ["restaurant", "food"];
    }

    const result = await searchAndDisplayPlaces(searchQuery.value);
    mainBars = result && result.results ? result.results : [];

    // 如果主要搜尋沒有結果，則嘗試使用附近的搜尋
    if ((!mainBars || mainBars.length === 0) && typeForNearby) {
      const google = googleMapsInstance.value;
      let center = null;
      if (map.value && map.value.getCenter) {
        const c = map.value.getCenter();
        center = new window.google.maps.LatLng(c.lat(), c.lng());
      } else {
        // Fallback to a default location (Taipei)
        center = new window.google.maps.LatLng(25.0478, 121.517);
      }

      const fallbackRequest = {
        location: center,
        radius: 5000, // 搜尋半徑
        type: typeForNearby,
      };

      const service = new google.places.PlacesService(map.value);
      mainBars = await new Promise((resolve) => {
        service.nearbySearch(fallbackRequest, async (results, status) => {
          if (status === google.places.PlacesServiceStatus.OK && results) {
            // 對於附近搜尋的結果，獲取更詳細的資料
            const detailedBars = await Promise.all(
              results.slice(0, 20).map(async (place) => {
                try {
                  const detail = await getPlaceDetails(place.place_id);
                  const tags = Array.isArray(detail.types)
                    ? detail.types.filter(
                        (type) => !COMMON_PLACE_TYPES_TO_EXCLUDE.includes(type)
                      )
                    : [];
                  const isOpen = detail.opening_hours
                    ? detail.opening_hours.isOpen()
                    : null;
                  const isBarLike = Array.isArray(detail.types)
                    ? detail.types.some((type) =>
                        BAR_PLACE_TYPES.includes(type)
                      )
                    : false;

                  return {
                    id: detail.place_id,
                    place_id: detail.place_id,
                    name: detail.name,
                    location: {
                      lat: detail.geometry.location.lat(),
                      lng: detail.geometry.location.lng(),
                    },
                    rating: detail.rating || 0,
                    reviews: detail.user_ratings_total || 0,
                    address: detail.formatted_address || "未知地址",
                    tags: tags,
                    opening_hours: detail.opening_hours,
                    is_open: isOpen,
                    imageUrl:
                      detail.photos && detail.photos.length > 0
                        ? detail.photos[0].getUrl({
                            maxWidth: 400,
                            maxHeight: 400,
                          })
                        : "",
                    images: detail.photos
                      ? detail.photos.map((p) =>
                          p.getUrl({ maxWidth: 800, maxHeight: 600 })
                        )
                      : [],
                    description: "點擊查看更多詳情...",
                    isWishlisted: false,
                    phone: detail.international_phone_number || null,
                    website: detail.website || null,
                    url: detail.url,
                    googleReviews: detail.reviews || [],
                    isBarLike: isBarLike,
                  };
                } catch (e) {
                  // 如果獲取詳情失敗，返回原始的 place 物件
                  return place;
                }
              })
            );
            resolve(detailedBars);
          } else {
            resolve([]);
          }
        });
      });
    }

    if (mainBars && mainBars.length > 0) {
      mainBarForSearch.value = null; // 清除之前的主要搜尋結果
      googleBars.value = mainBars;
      // 將地圖中心移動到第一個結果
      if (googleMapsInstance.value && mainBars[0] && mainBars[0].location) {
        panTo(mainBars[0].location, 15);
      }
    } else {
      mainBarForSearch.value = null;
      googleBars.value = [];
      alert("查無結果。");
    }
  } catch (err) {
    mainBarForSearch.value = null;
    googleBars.value = [];
    alert("搜尋失敗，請稍後再試。");
  } finally {
    isLoading.value = false;
  }
}

async function handleGetCurrentLocation() {
  isLoading.value = true;
  try {
    clearMarkers("all");
    closeInfoWindow();
    // 獲取側邊欄寬度，用於調整地圖中心點
    const sidebarWidth =
      document.querySelector(".bar-list-sidebar")?.offsetWidth || 0;
    const currentLocation = await getMapCurrentLocation(sidebarWidth);
    if (currentLocation) {
      // 獲取當前位置後，重新搜尋地圖範圍內的酒吧
      const bars = await searchBarsInMapBounds(false);
      googleBars.value = bars;
    }
  } catch (err) {
    console.error("獲取目前位置失敗:", err);
    // 如果失敗，設定一個預設中心點
    const google = googleMapsInstance.value;
    if (google && map.value) {
      const fallbackLocation = new window.google.maps.LatLng(25.0478, 121.517); // 台北市中心
      map.value.setCenter(fallbackLocation);
      map.value.setZoom(15);
      // 仍然嘗試搜尋該預設位置附近的酒吧
      const bars = await searchBarsInMapBounds(false);
      googleBars.value = bars;
    }
  } finally {
    isLoading.value = false;
  }
}

function handleFilterChanged(filters) {
  currentFilters.value = { ...filters };
}

async function handleBarSelected(bar) {
  // 如果是從列表點擊，且沒有完整的 googleReviews，則去獲取
  if (bar.place_id && (!bar.googleReviews || bar.googleReviews.length === 0)) {
    try {
      const detail = await getPlaceDetails(bar.place_id);
      if (detail && detail.reviews) {
        bar.googleReviews = detail.reviews;
      }
    } catch (e) {
      console.warn("自動補抓 Google 評論失敗", e);
    }
  }
  selectedBarForDetail.value = bar || {};
  isBarDetailModalOpen.value = true;

  // 更新 URL 參數
  const params = new URLSearchParams({
    barId: bar.place_id || bar.id,
    name: bar.name || "",
    rating: bar.rating || "",
    reviews: bar.reviews || 0,
    address: bar.address || "",
  });
  router.replace({
    query: { ...route.query, ...Object.fromEntries(params) },
  });

  // 地圖操作：移動視角並顯示資訊窗
  if (bar.location && map && googleMapsInstance()) {
    panTo(bar.location);
    // 為了顯示資訊窗，需要一個臨时的 Marker
    const tempMarker = new window.google.maps.Marker({
      position: new window.google.maps.LatLng(
        bar.location.lat,
        bar.location.lng
      ),
      map: map.value,
      title: bar.name,
      icon: {
        url: bar.isBarLike ? "/wine.png" : "/MapMarker.png", // 假設 bar.isBarLike 判斷是否為酒吧類型
        scaledSize: new window.google.maps.Size(40, 40),
        anchor: new window.google.maps.Point(20, 40),
      },
    });
    const infoContent = formatBarInfoWindowContent(bar);
    showInfoWindow(tempMarker, infoContent);
  }
    // 手機版自動隱藏側邊欄
  if (isMobile.value) {
    showSidebarOnMobile.value = false;
  }
}

function closeBarDetailModal() {
  isBarDetailModalOpen.value = false;
  selectedBarForDetail.value = null;
  closeInfoWindow(); // 關閉地圖上的資訊窗

  // 清除 URL 參數
  const newQuery = { ...route.query };
  delete newQuery.barId;
  delete newQuery.name;
  delete newQuery.rating;
  delete newQuery.reviews;
  delete newQuery.address;
  router.replace({ query: newQuery });
}

function handleToggleWishlist(barId) {
  // 更新 googleBars 列表中的收藏狀態
  const barIndex = googleBars.value.findIndex((b) => b.place_id === barId);
  if (barIndex > -1) {
    const updatedBar = { ...googleBars.value[barIndex] };
    updatedBar.isWishlisted = !updatedBar.isWishlisted;
    googleBars.value.splice(barIndex, 1, updatedBar);
  }
  // 同步更新 selectedBarForDetail 的收藏狀態
  if (
    selectedBarForDetail.value &&
    selectedBarForDetail.value.place_id === barId
  ) {
    selectedBarForDetail.value.isWishlisted =
      !selectedBarForDetail.value.isWishlisted;
  }
}

const handleToggleWishlistFromDetail = (barId) => {
  handleToggleWishlist(barId);
};

function handleTagClick(tag) {
  if (!tag) {
    selectedTag.value = null;
    searchQuery.value = "";
    googleBars.value = []; // 清空酒吧列表
  } else {
    selectedTag.value = tag;
    searchQuery.value = tag; // 將標籤設為搜尋關鍵字
    handleSearch(); // 執行搜尋
  }
}

function handleClickOutside(event) {
  const el = searchInputRef.value;
  if (el && !el.contains(event.target)) {
    suggestions.value = [];
  }
}

function toggleFilterPanel() {
  isFilterPanelOpen.value = !isFilterPanelOpen.value;
}

// 添加必要的 watch 和初始化邏輯
const checkUrlForBarDetail = async () => {
  const barId = route.query.barId;
  if (barId && !isBarDetailModalOpen.value) {
    // 先檢查現有的酒吧列表中是否有這個酒吧
    let barFromList = googleBars.value.find(
      (bar) => bar.place_id === barId || bar.id === barId
    );
    if (barFromList) {
      selectedBarForDetail.value = barFromList;
      isBarDetailModalOpen.value = true;
    } else {
      // 從參數創建基本資訊
      const barFromUrl = {
        id: barId,
        place_id: barId,
        name: route.query.name || "載入中...",
        rating: parseFloat(route.query.rating) || null,
        reviews: parseInt(route.query.reviews) || 0,
        address: route.query.address || "",
        // 添加載入標記
        isQuickLoad: true,
        isWishlisted: false,
      };
      selectedBarForDetail.value = barFromUrl;
      isBarDetailModalOpen.value = true;
            try {
        const fullData = await getPlaceDetails(barId);
        if (
          fullData &&
          selectedBarForDetail.value &&
          selectedBarForDetail.value.place_id === barId
        ) {
          const detailedBar = {
            id: fullData.place_id,
            place_id: fullData.place_id,
            name: fullData.name,
            location: {
              lat: fullData.geometry.location.lat(),
              lng: fullData.geometry.location.lng(),
            },
            rating: fullData.rating || 0,
            reviews: fullData.user_ratings_total || 0,
            address: fullData.formatted_address || "未知地址",
            priceRange:
              fullData.price_level !== undefined
                ? `等級 ${fullData.price_level}`
                : null,
            tags: fullData.types
              ? fullData.types.filter(
                  (type) => !COMMON_PLACE_TYPES_TO_EXCLUDE.includes(type)
                )
              : [],
            opening_hours: fullData.opening_hours,
            imageUrl:
              fullData.photos && fullData.photos.length > 0
                ? fullData.photos[0].getUrl({ maxWidth: 400, maxHeight: 400 })
                : "",
            images: fullData.photos
              ? fullData.photos.map((p) =>
                  p.getUrl({ maxWidth: 800, maxHeight: 600 })
                )
              : [],
            description: "點擊查看更多詳情...",
            isWishlisted: false,
            phone: fullData.international_phone_number || null,
            website: fullData.website || null,
            url: fullData.url,
            googleReviews: fullData.reviews || [],
          };
          selectedBarForDetail.value = detailedBar;
          // 將完整資料加入到酒吧列表中
          const existingIndex = googleBars.value.findIndex(
            (bar) => bar.place_id === barId
          );
          if (existingIndex === -1) {
            googleBars.value.unshift(detailedBar);
          }
          // 如果有位置資訊，移動地圖視角
          if (detailedBar.location && map.value) {
            panTo(detailedBar.location);
          }
        }
      } catch (error) {
        console.error("載入完整酒吧資料失敗:", error);
      }
    }
  }
};

watch(
  mapContainer,
  (newVal) => {
    if (newVal && typeof googleMapsInstance === "function" && googleMapsInstance()) {
      // 確保地圖容器有正確的尺寸
      setTimeout(() => {
        if (map.value && window.google && window.google.maps) {
          window.google.maps.event.trigger(map.value, 'resize');
        }
      }, 100);
    }
  },
  { immediate: true }
);

watch(
  () => route.query.barId,
  (newBarId, oldBarId) => {
    if (newBarId && newBarId !== oldBarId) {
      checkUrlForBarDetail();
    } else if (!newBarId && isBarDetailModalOpen.value) {
      closeBarDetailModal();
    }
  }
);

watch(isReady, (ready) => {
  if (ready && map && typeof googleMapsInstance === "function" && googleMapsInstance()) {
    const onMapIdleHandler = async () => {
      if (!isFetching.value && !isLoading.value) {
        const barsInBounds = await searchBarsInMapBounds(false);
        googleBars.value = barsInBounds;
      }
    };
    if (map.value && map.value.addListener) {
      map.value.addListener("idle", onMapIdleHandler);
    }
    // 地圖準備好後立即檢查 URL 參數
    checkUrlForBarDetail();
  }
});

watch(
  filteredBars,
  (newBars) => {
    if (map && typeof googleMapsInstance === "function" && googleMapsInstance()) {
      displayBarsOnMap(newBars, formatBarInfoWindowContent);
    }
  },
  { immediate: false }
);

watch(selectedBar, (newVal) => {
  if (!newVal && !isBarDetailModalOpen.value) {
    closeInfoWindow();
  }
});

// 監聽視窗大小變化，重新調整地圖
watch([isMobile, showSidebarOnMobile], () => {
  if (map.value && window.google && window.google.maps) {
    setTimeout(() => {
      window.google.maps.event.trigger(map.value, 'resize');
    }, 300); // 給予一些時間讓 CSS 變更生效
  }
});

onMounted(() => {
  checkDeviceType();
  window.addEventListener('resize', checkDeviceType);
  document.addEventListener("click", handleClickOutside);
  
  // 初始化地圖，並在初始化完成後檢查 URL 參數
  loadGoogleMapsAPI().then(() => {
    initMap().then(() => {
      // checkUrlForBarDetail() 在 isReady watch 中執行
    });
  });
});

onUnmounted(() => {
  window.removeEventListener('resize', checkDeviceType);
  document.removeEventListener("click", handleClickOutside);
});

</script>

<style scoped>
/* 手機版樣式 */
.mobile-top-controls {
  padding-top: env(safe-area-inset-top);
}

.mobile-control-button {
  padding: 8px;
  border: none;
  background-color: #f8f9fa;
  color: #333;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  min-width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mobile-control-button:hover {
  background-color: #e9ecef;
}

.search-panel-mobile {
  position: relative;
}

.input-group-mobile {
  display: flex;
  background-color: #f8f9fa;
  border-radius: 20px;
  overflow: hidden;
}

.search-input-mobile {
  flex: 1;
  border: none;
  background: transparent;
  padding: 8px 12px;
  outline: none;
  font-size: 14px;
}

.search-button-mobile {
  padding: 8px 12px;
  border: none;
  background: transparent;
  color: #666;
  cursor: pointer;
}

.suggestions-list-mobile {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  margin-top: 4px;
}

.suggestions-list-mobile li {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  font-size: 14px;
}

.suggestions-list-mobile li:hover {
  background-color: #f8f9fa;
}

.suggestions-list-mobile li:last-child {
  border-bottom: none;
}

/* 側邊欄手機版樣式 */
.bar-list-sidebar {
  width: 380px;
  background-color: #f7f7f7;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  z-index: 50;
  transition: transform 0.3s ease-in-out;
}

@media (max-width: 767px) {
  .bar-list-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 200;
    transform: translateX(0);
    padding-top: env(safe-area-inset-top);
  }
  
  .sidebar-mobile-hidden {
    transform: translateX(-100%);
  }
  
  .map-container {
    width: 100%;
    height: calc(100vh - 60px); /* 減去頂部控制欄高度 */
    margin-top: 60px; /* 為頂部控制欄留空間 */
    padding-bottom: env(safe-area-inset-bottom);
  }
  
  .map-fullscreen {
    padding-top: 60px;
  }
}

/* 底部按鈕樣式 */
.mobile-bottom-toggle button {
  backdrop-filter: blur(10px);
  background-color: rgba(255, 255, 255, 0.95);
}

/* 濾鏡面板手機版樣式 */
.filter-panel-mobile {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 100% !important;
  z-index: 300 !important;
  padding-top: env(safe-area-inset-top);
}

/* 桌面版樣式保持不變 */
.desktop-top-controls {
  /* 原有樣式 */
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
  transition: background-color 0.2s, transform 0.2s;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  outline: none;
}

.map-control-button:hover {
  background-color: #a08d7a;
  transform: translateY(-2px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

/* 原有樣式保持不變 */
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
  background-color: var(--color-main-text);
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
  transition: background-color 0.2s, transform 0.2s;
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

.suggestions-list li:hover {
  background: #f0f0f0;
}

.map-container {
  flex-grow: 1;
  height: 100%;
  min-height: 400px;
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

/* 確保在不同螢幕尺寸下的適配 */
@media (max-width: 480px) {
  .mobile-top-controls .flex {
    padding: 8px;
  }
  
  .mobile-control-button {
    min-width: 36px;
    height: 36px;
    font-size: 14px;
  }
  
  .search-input-mobile {
    font-size: 16px; /* 防止iOS縮放 */
  }
}

@media (min-width: 768px) {
  .mobile-top-controls,
  .mobile-bottom-toggle {
    display: none !important;
  }
  
  .map-container {
    padding-top: 0;
  }
  
  .bar-list-sidebar {
    position: relative;
    transform: none;
  }
}
</style>