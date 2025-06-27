<template>
  <div class="flex h-screen w-screen overflow-hidden relative">
    <div class="top-left-controls absolute top-5 left-[400px] z-[100] flex flex-row flex-wrap items-center gap-[10px] p-[15px] bg-white/90 rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.2)] transition-[left] duration-300 ease-in-out">
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

    <aside class="bar-list-sidebar">
      <div class="flex-grow overflow-y-auto p-4">
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
      @tag-click="handleTagClick"
      :initial-filters="currentFilters"
      :selected-tag="selectedTag"
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
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
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
      const currentDayOfWeek = now.day();

      if (!bar.opening_hours || !bar.opening_hours.periods) return false;

      const filterStart = dayjs()
        .hour(filters.minOpenHour)
        .minute(filters.minOpenMinute);
      let filterEnd = dayjs()
        .hour(filters.maxOpenHour)
        .minute(filters.maxOpenMinute);
      if (filters.maxOpenHour === 24 && filters.maxOpenMinute === 0) {
        filterEnd = filterEnd.endOf("day");
      }
      if (filterEnd.isBefore(filterStart)) {
        filterEnd = filterEnd.add(1, "day");
      }

      for (const period of bar.opening_hours.periods) {
        if (period.open && period.close) {
          let openTime = dayjs()
            .day(period.open.day)
            .hour(Math.floor(period.open.time / 100))
            .minute(period.open.time % 100);
          let closeTime = dayjs()
            .day(period.close.day)
            .hour(Math.floor(period.close.time / 100))
            .minute(period.close.time % 100);

          if (closeTime.isBefore(openTime)) {
            closeTime = closeTime.add(1, "day");
          }

          const hasIntersection =
            openTime.isBefore(filterEnd) && closeTime.isAfter(filterStart);

          if (hasIntersection) {
            return true;
          }
        }
      }
      return false;
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

// 點擊欄位以外區域會收起建議清單
function handleClickOutside(event) {
  const el = searchInputRef.value;
  if (el && !el.contains(event.target)) {
    suggestions.value = [];
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});

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
    const sidebarWidth =
      document.querySelector(".bar-list-sidebar")?.offsetWidth || 0;
    const currentLocation = await getMapCurrentLocation(sidebarWidth);
    if (currentLocation) {
      const bars = await searchBarsInMapBounds(false);
      googleBars.value = bars;
    }
  } catch (err) {
    const google = googleMapsInstance.value;
    if (google && map.value) {
      const fallbackLocation = new window.google.maps.LatLng(25.0478, 121.517);
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

function toggleFilterPanel() {
  isFilterPanelOpen.value = !isFilterPanelOpen.value;
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
  const barIndex = googleBars.value.findIndex((b) => b.place_id === barId);
  if (barIndex > -1) {
    const updatedBar = { ...googleBars.value[barIndex] };
    updatedBar.isWishlisted = !updatedBar.isWishlisted;
    googleBars.value.splice(barIndex, 1, updatedBar);
  }
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

watch(
  mapContainer,
  (newVal) => {
    if (
      newVal &&
      typeof googleMapsInstance === "function" &&
      googleMapsInstance()
    ) {
      initMap();
    }
  },
  { immediate: true }
);

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

onMounted(async () => {
  isLoading.value = true;
  try {
    await loadGoogleMapsAPI();
    if (mapContainer.value) {
      await initMap();
      requestGeolocationPermission();
      let gotLocation = false;
      try {
        const sidebarWidth =
          document.querySelector(".bar-list-sidebar")?.offsetWidth || 0;
        const currentLocation = await getMapCurrentLocation(sidebarWidth);
        if (currentLocation) {
          gotLocation = true;
          const bars = await searchBarsInMapBounds(false);
          googleBars.value = bars;
        }
      } catch (geoErr) {
        const google = googleMapsInstance.value;
        if (google && map.value) {
          const fallbackLocation = new window.google.maps.LatLng(
            25.0478,
            121.517
          );
          map.value.setCenter(fallbackLocation);
          map.value.setZoom(15);
          const bars = await searchBarsInMapBounds(false);
          googleBars.value = bars;
        }
        if (!gotLocation) {
          alert("無法獲取您的目前位置");
        }
      }
    } else {
      console.error("錯誤：地圖容器 ref 未綁定，無法初始化地圖。");
    }
  } catch (err) {
    console.error("地圖或數據載入失敗:", err);
    alert("初始化失敗，請檢查控制台錯誤。");
  } finally {
    isLoading.value = false;
  }
  await checkUrlForBarDetail();
});

</script>

<style scoped>
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
  box-shadow: none;
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
  transition:
    background-color 0.2s,
    transform 0.2s;
}

.search-bt:hover {
  background-color: #860914;
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

.no-bars-message {
  text-align: center;
  color: #666;
  margin-top: 20px;
  font-size: 18px;
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
