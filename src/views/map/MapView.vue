<template>
  <div class="flex overflow-hidden relative w-screen h-screen">
    <slot name="navbar"></slot>

    <div
      class="mobile-top-controls md:hidden absolute top-0 left-0 right-0 z-[90] bg-white shadow-md w-full"
    >
      <div class="flex flex-wrap gap-2 justify-between items-center p-3">
        <div class="flex-shrink-0 mobile-bottom-toggle">
          <button
            @click="toggleMobileSidebar"
            class="flex gap-2 items-center px-4 py-2 bg-white rounded-full border shadow"
          >
            <i class="fas fa-list"></i>
            <span class="text-sm font-medium">酒吧列表</span>
            <span class="px-2 py-1 text-xs text-white bg-blue-500 rounded-full">
              {{ filteredBars.length }}
            </span>
          </button>
        </div>
        <div class="flex flex-1 gap-1 items-center min-w-0">
          <div
            class="flex-shrink w-24 search-panel-mobile sm:w-32"
            ref="searchInputRef"
            style="position: relative"
          >
            <div class="input-group-mobile">
              <input
                type="text"
                id="searchInput"
                class="search-input-mobile"
                v-model="searchQuery"
                placeholder="搜尋地點..."
                @input="debouncedSearchSuggestions"
                style="margin-left: 0"
              />
              <button
                @click="handleSearch"
                class="search-button-mobile"
                :disabled="!isReady"
                style="margin-left: 0"
              >
                <i class="fas fa-search"></i>
              </button>
            </div>
          </div>
          <button
            @click="handleGetCurrentLocation"
            class="location-button-mobile mobile-control-button"
          >
            <i class="fas fa-location-arrow"></i>
          </button>
          <button
            class="filter-toggle-button mobile-control-button"
            @click="toggleFilterPanel"
          >
            <img
              src="/filter-toggle-button.svg"
              alt="filter"
              class="filter-svg-icon"
            />
          </button>
        </div>
      </div>
    </div>

    <ul
      v-if="suggestions.length && isMobile"
      class="suggestions-list-mobile-overlay"
    >
      <li
        v-for="(suggestion, idx) in suggestions"
        :key="idx"
        @click="selectSuggestion(suggestion)"
      >
        <span style="font-size: 16px">🔍</span>
        {{ suggestion.description }}
      </li>
    </ul>

    <div
      class="top-left-controls hidden md:flex absolute top-5 left-[var(--sidebar-width,40px)] z-[101] flex-row flex-wrap items-center gap-[10px] p-[15px] bg-white/90 rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.2)] transition-[left] duration-300 ease-in-out"
      :style="{ left: isSidebarCollapsed ? '96px' : '440px' }"
    >
      <button
        class="filter-toggle-button map-control-button"
        @click="toggleFilterPanel"
      >
        <img
          src="/filter-toggle-button.svg"
          alt="filter"
          class="filter-svg-icon"
        />
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
          <ul v-if="suggestions.length && !isMobile" class="suggestions-list">
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

    <aside
      :class="[
        'bar-list-sidebar',
        {
          'sidebar-mobile-hidden': !showSidebarOnMobile,
          'sidebar-collapsed': isSidebarCollapsed,
        },
      ]"
    >
      <div class="sidebar-toggle-btn" @click="toggleSidebarCollapse">
        <span v-if="!isSidebarCollapsed">⮜</span>
        <span v-else>⮞</span>
      </div>
      <div v-if="!isSidebarCollapsed">
        <div class="mobile-sidebar-header md:hidden">
          <div class="flex justify-between items-center p-4 bg-white border-b">
            <h3 class="text-lg font-bold">酒吧列表</h3>
            <button
              @click="toggleMobileSidebar"
              class="text-gray-500 hover:text-gray-700"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        <div class="overflow-y-auto flex-grow p-4">
          <BarList
            :bars="filteredBars"
            @bar-selected="handleBarSelected"
            @toggle-wishlist="handleToggleWishlist"
          />
        </div>
      </div>
    </aside>

    <div
      ref="mapContainer"
      :class="['map-container', { 'map-fullscreen': !showSidebarOnMobile }]"
    ></div>

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

const showSidebarOnMobile = ref(false);
const isMobile = ref(false);

const checkDeviceType = () => {
  isMobile.value = window.innerWidth < 768;
  if (!isMobile.value) {
    showSidebarOnMobile.value = false;
  } else {
    showSidebarOnMobile.value = false;
  }
};

const toggleMobileSidebar = () => {
  showSidebarOnMobile.value = !showSidebarOnMobile.value;
};

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

  if (filters.address && filters.address !== "current_location") {
    if (Array.isArray(filters.address)) {
      if (filters.address.length > 0) {
        bars = bars.filter((bar) =>
          filters.address.some((addr) => bar.address?.includes(addr))
        );
      }
    } else if (
      typeof filters.address === "string" &&
      filters.address !== "current_location"
    ) {
      bars = bars.filter((bar) => bar.address?.includes(filters.address));
    }
  }

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
      if (filters.address && filters.address !== "current_location") {
        let addressArr = Array.isArray(filters.address)
          ? filters.address
          : [filters.address];
        const hasMatchingDistrict = selectedDistrictTagsFromTagsFilter.some(
          (tag) => addressArr.some((addr) => addr.includes(tag))
        );
        if (!hasMatchingDistrict) {
          return [];
        }
      } else {
        bars = bars.filter((bar) =>
          selectedDistrictTagsFromTagsFilter.every((tag) => {
            return bar.address?.includes(tag);
          })
        );
      }
    }
  }

  if (
    map &&
    typeof googleMapsInstance === "function" &&
    googleMapsInstance() &&
    googleMapsInstance().maps &&
    googleMapsInstance().maps.geometry &&
    googleMapsInstance().maps.geometry.spherical
  ) {
    const mapCenter = map.value.getCenter && map.value.getCenter();
    if (mapCenter) {
      const centerLatLng = new window.google.maps.LatLng(
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
            return { ...bar, distance: Infinity };
          }
          const barLatLng = new window.google.maps.LatLng(
            bar.location.lat,
            bar.location.lng
          );
          bar.distance =
            googleMapsInstance().maps.geometry.spherical.computeDistanceBetween(
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

  if (
    filters.minOpenHour !== 0 ||
    filters.minOpenMinute !== 0 ||
    filters.maxOpenHour !== 24 ||
    filters.maxOpenMinute !== 0
  ) {
    bars = bars.filter((bar) => {
      const now = dayjs();
      const currentDay = now.day();

      if (!bar.opening_hours || !bar.opening_hours.periods) {
        return false;
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
        return false;
      }

      return periodsToday.some((period) => {
        const periodOpenHour = Math.floor(period.open.time / 100);
        const periodOpenMinute = period.open.time % 100;
        const periodOpen = dayjs()
          .hour(periodOpenHour)
          .minute(periodOpenMinute);

        let periodClose = null;
        if (period.close) {
          const periodCloseHour = Math.floor(period.close.time / 100);
          const periodCloseMinute = period.close.time % 100;
          periodClose = dayjs().hour(periodCloseHour).minute(periodCloseMinute);

          // 處理跨天的情況
          if (periodClose.isBefore(periodOpen)) {
            periodClose = periodClose.add(1, "day");
          }
        } else {
          // 如果沒有關閉時間，表示營業到深夜或24小時
          periodClose = dayjs().endOf("day").add(1, "day");
        }

        // 檢查使用者選擇的開放時間是否在酒吧的營業時間內
        const userOpenTimeWithinPeriod = openTime.isBetween(
          periodOpen,
          periodClose,
          null,
          "[)"
        );
        const userCloseTimeWithinPeriod = closeTime.isBetween(
          periodOpen,
          periodClose,
          null,
          "(]"
        );

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

  if (filters.ratingSort === "highToLow") {
    bars.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  } else if (filters.ratingSort === "lowToHigh") {
    bars.sort((a, b) => (a.rating || 0) - (b.rating || 0));
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
    let typeForNearby = "establishment";
    const q = searchQuery.value.trim().toLowerCase();

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
        center = new window.google.maps.LatLng(25.0478, 121.517);
      }

      const fallbackRequest = {
        location: center,
        radius: 5000,
        type: typeForNearby,
      };

      const service = new google.places.PlacesService(map.value);
      mainBars = await new Promise((resolve) => {
        service.nearbySearch(fallbackRequest, async (results, status) => {
          if (status === google.places.PlacesServiceStatus.OK && results) {
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
      mainBarForSearch.value = null;
      googleBars.value = mainBars;
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
    const google = googleMapsInstance.value;
    if (google && map.value) {
      const fallbackLocation = new window.google.maps.LatLng(25.0478, 121.517); // 台北市中心
      map.value.setCenter(fallbackLocation);
      map.value.setZoom(15);
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

  // 地圖移動視角並顯示資訊窗
  if (bar.location && map && googleMapsInstance()) {
    panTo(bar.location);
    const tempMarker = new window.google.maps.Marker({
      position: new window.google.maps.LatLng(
        bar.location.lat,
        bar.location.lng
      ),
      map: map.value,
      title: bar.name,
      icon: {
        url: bar.isBarLike ? "/wine.png" : "/MapMarker.png",
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
  closeInfoWindow();

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
    googleBars.value = [];
  } else {
    selectedTag.value = tag;
    searchQuery.value = tag;
    handleSearch();
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

const checkUrlForBarDetail = async () => {
  const barId = route.query.barId;
  if (barId && !isBarDetailModalOpen.value) {
    let barFromList = googleBars.value.find(
      (bar) => bar.place_id === barId || bar.id === barId
    );
    if (barFromList) {
      selectedBarForDetail.value = barFromList;
      isBarDetailModalOpen.value = true;
    } else {
      const barFromUrl = {
        id: barId,
        place_id: barId,
        name: route.query.name || "載入中...",
        rating: parseFloat(route.query.rating) || null,
        reviews: parseInt(route.query.reviews) || 0,
        address: route.query.address || "",
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
          const existingIndex = googleBars.value.findIndex(
            (bar) => bar.place_id === barId
          );
          if (existingIndex === -1) {
            googleBars.value.unshift(detailedBar);
          }
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
    if (
      newVal &&
      typeof googleMapsInstance === "function" &&
      googleMapsInstance()
    ) {
      setTimeout(() => {
        if (map.value && window.google && window.google.maps) {
          window.google.maps.event.trigger(map.value, "resize");
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
  if (
    ready &&
    map &&
    typeof googleMapsInstance === "function" &&
    googleMapsInstance()
  ) {
    const onMapIdleHandler = async () => {
      if (!isFetching.value && !isLoading.value) {
        const barsInBounds = await searchBarsInMapBounds(false);
        googleBars.value = barsInBounds;
      }
    };
    if (map.value && map.value.addListener) {
      map.value.addListener("idle", onMapIdleHandler);
    }
    checkUrlForBarDetail();
  }
});

watch(
  filteredBars,
  (newBars) => {
    if (
      map &&
      typeof googleMapsInstance === "function" &&
      googleMapsInstance()
    ) {
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
      window.google.maps.event.trigger(map.value, "resize");
    }, 300); // 讓 CSS 變更生效
  }
});

const isSidebarCollapsed = ref(true);

watch(filteredBars, (bars) => {
  if (bars && bars.length > 0) {
    isSidebarCollapsed.value = false;
  } else {
    isSidebarCollapsed.value = true;
  }
});

function toggleSidebarCollapse() {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
}

onMounted(() => {
  checkDeviceType();
  window.addEventListener("resize", checkDeviceType);
  document.addEventListener("click", handleClickOutside);

  // 初始化地圖，並在初始化完成後檢查 URL 參數
  loadGoogleMapsAPI().then(() => {
    initMap().then(() => {});
  });
});

onUnmounted(() => {
  window.removeEventListener("resize", checkDeviceType);
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style scoped>
.suggestions-list-mobile-overlay {
  position: absolute;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  width: 90vw;
  max-width: 500px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18);
  max-height: 220px;
  overflow-y: auto;
  z-index: 900;
  margin: 0;
  padding: 0;
  list-style: none;
}

.suggestions-list-mobile-overlay li {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s ease;
}

.suggestions-list-mobile-overlay li:hover {
  background-color: #f8f9fa;
}

.suggestions-list-mobile-overlay li:last-child {
  border-bottom: none;
}

.suggestions-list-mobile-overlay li:first-child {
  border-radius: 8px 8px 0 0;
}

.suggestions-list-mobile-overlay li:last-child {
  border-radius: 0 0 8px 8px;
}

/* 手機版樣式 */
.mobile-top-controls {
  padding-top: env(safe-area-inset-top);
}

.mobile-control-button {
  padding: 6px;
  border: none;
  background-color: #f8f9fa;
  color: #333;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
  min-width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.mobile-control-button:hover {
  background-color: #e9ecef;
}

.search-panel-mobile {
  position: static;
  flex-shrink: 1;
  z-index: 1000;
}

.input-group-mobile {
  display: flex;
  background-color: #f8f9fa;
  border-radius: 16px;
  overflow: hidden;
  align-items: stretch;
  height: 32px;
}

.search-input-mobile {
  flex: 1;
  border: none;
  background: transparent;
  padding: 8px 12px;
  outline: none;
  font-size: 14px;
  min-width: 0;
  height: 32px;
}

.search-button-mobile {
  min-width: 32px;
  min-height: 32px;
  padding: 2px 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: #666;
  cursor: pointer;
}

.search-button-mobile i {
  font-size: 16px;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 側邊欄手機版樣式 */
.bar-list-sidebar {
  position: relative;
  transition: width 0.3s;
}

.bar-list-sidebar.sidebar-collapsed {
  width: 32px !important;
  min-width: 32px !important;
  max-width: 32px !important;
  overflow: visible !important;
  box-shadow: none;
  background: transparent;
}

.sidebar-toggle-btn {
  position: absolute;
  top: 50%;
  right: -16px;
  transform: translateY(-50%);
  width: 32px;
  height: 48px;
  background: #fff;
  border-radius: 0 8px 8px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1000;
  border: 1px solid #eee;
}

@media (max-width: 767px) {
  html,
  body,
  .relative.w-screen.h-screen.overflow-hidden {
    overflow-x: hidden !important;
    width: 100vw !important;
    max-width: 100vw !important;
    position: relative;
  }

  .bar-list-sidebar {
    position: absolute;
    top: 60px;
    left: 0;
    width: 80vw;
    max-width: 320px;
    height: auto;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    z-index: 300;
    background: #fff;
    transition: none;
    padding: 0;
  }

  .sidebar-mobile-hidden {
    display: none;
  }

  .mobile-sidebar-header {
    border-radius: 12px 12px 0 0;
  }

  .bar-list-sidebar .flex-grow.p-4.overflow-y-auto {
    max-height: 60vh;
    overflow-y: auto;
  }

  .map-container {
    width: 100%;
    height: calc(100vh - 60px);
    margin-top: 60px;
    padding-bottom: env(safe-area-inset-bottom);
  }

  .map-fullscreen {
    padding-top: 60px;
  }

  .mobile-top-controls {
    justify-content: flex-start;
  }

  .mobile-top-controls .flex.flex-1.gap-1.items-center.min-w-0 {
    margin-left: 8px;
  }

  .search-panel-mobile {
    width: 120px;
    min-width: 100px;
    max-width: 120px;
  }

  .mobile-control-button {
    min-width: 33px;
    height: 28px;
    font-size: 11px;
    margin-left: 2px;
  }

  .filter-toggle-button {
    width: 28px;
    height: 28px;
    font-size: 12px;
    margin-right: -10px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }
  .filter-toggle-button i {
    font-size: 12px;
  }
  .mobile-bottom-toggle button {
    width: 90px;
    min-width: 108px;
    max-width: 108px;
    padding: 4px 10px;
    min-height: 24px;
    height: 28px;
    border-radius: 14px;
    gap: 4px;
    margin-left: -4px;
  }
  .mobile-bottom-toggle button i {
    font-size: 11px;
  }
  .mobile-bottom-toggle button span {
    font-size: 10px;
  }
  .filter-panel-mobile {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    width: 80% !important;
    height: 100% !important;
    bottom: 0 !important;
    z-index: 99999 !important;
    padding-top: env(safe-area-inset-top);
    border-radius: 10px;
  }

  .location-button-mobile,
  .filter-toggle-button {
    width: 28px;
    height: 28px;
    min-width: 28px;
    min-height: 28px;
    font-size: 16px;
    margin-left: 2px;
  }
  .filter-svg-icon {
    width: 18px;
    height: 18px;
  }

  .mobile-top-controls .flex.flex-wrap.gap-2.justify-between.items-center.p-3 {
    transform: scale(1.18);
    transform-origin: left center;
    width: 100%;
    max-width: 100vw;
    box-sizing: border-box;
  }
}

@media (max-width: 480px) {
  .search-panel-mobile {
    width: 140px;
    min-width: 120px;
  }

  .mobile-control-button {
    min-width: 26px;
    height: 26px;
    font-size: 10px;
  }

  .search-input-mobile {
    font-size: 16px;
  }
}

.mobile-bottom-toggle button {
  backdrop-filter: blur(10px);
  background-color: rgba(255, 255, 255, 0.95);
}

.top-left-controls {
  gap: 0px;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: flex-start;
}

.search-and-location-group {
  display: flex;
  flex-grow: 1;
  align-items: center;
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

.filter-toggle-button {
  background: #f8f9fa;
  border: none;
  box-shadow: none;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}
.filter-toggle-button:hover {
  background: #e9ecef;
}
.filter-svg-icon {
  width: 16px;
  height: 16px;
  display: block;
}

.search-panel-map {
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
  border-right: 0;
  border-radius: 0;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  outline: none;
  transition:
    background-color 0.2s,
    transform 0.2s;
}

.search-bt:hover {
  background-color: var(--color-primary-orange);
  color: #ffffff;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.search-bt:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.search-input:focus {
  border-color: #b8a28e;
  box-shadow: 0 0 0 2px rgba(184, 162, 142, 0.2);
}

.place-now-map {
  padding: 8px 12px;
  margin: 0;
  border: 1px solid #decdd5;
  border-left: 0;
  background-color: var(--color-main-text);
  color: #3a3435;
  border-radius: 0 8px 8px 0;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  outline: none;
}

.place-now-map:hover {
  background-color: var(--color-primary-orange);
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

@media (min-width: 768px) {
  .mobile-top-controls,
  .mobile-bottom-toggle {
    display: none !important;
  }

  .suggestions-list-mobile-overlay {
    display: none !important;
  }

  .map-container {
    padding-top: 0;
  }

  .bar-list-sidebar {
    position: relative;
    transform: none;
    width: 380px;
  }

  html,
  body {
    overflow-x: hidden !important;
  }

  .top-left-controls {
    width: auto;
    max-width: calc(100vw - 420px);
    flex-wrap: nowrap;
    gap: 10px;
  }

  .search-panel-map {
    display: flex;
  }

  .search-and-location-group {
    display: flex;
    align-items: center;
    flex-grow: 1;
  }

  .filter-toggle-button {
    margin-right: 0;
  }

  .input-group {
    flex: 1;
  }

  .search-input {
    border-radius: 8px 0 0 8px;
    border-right: none;
  }

  .search-bt {
    border-radius: 0;
    border-left: none;
    border-right: none;
  }

  .place-now-map {
    border-radius: 0 8px 8px 0;
    border-left: none;
  }
}

:global(.mobile-menu.open) {
  z-index: 10000 !important;
}

.mobile-bottom-toggle .rounded-full.bg-blue-500 {
  padding: 2px 6px !important;
  font-size: 12px !important;
  min-width: 22px;
  min-height: 18px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
