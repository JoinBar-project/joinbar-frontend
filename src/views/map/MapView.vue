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

// 引入 useGoogleMaps composable，它現在會自動導向到 index.js
import { useGoogleMaps } from "@/composable/useGoogleMaps";
// 引入 Google Maps 常數，用於過濾 tags
import { COMMON_PLACE_TYPES_TO_EXCLUDE } from "@/composable/googleMapsConstants"; // <-- 新增：引入常數

// --- 環境變數設定 ---
const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const myMapId = import.meta.env.VITE_MAP_ID;

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
  displayBarsOnMap, // <-- 這個函式現在需要第二個參數
  requestGeolocationPermission,
  getCurrentLocation: getMapCurrentLocation,
  getPlacePredictions,
  searchAndDisplayPlaces, // 已優化多頁獲取
  searchBarsInMapBounds, // 已優化多頁獲取
  clearMarkers, // <-- 注意這裡，我們會直接使用這個函數
  google: googleMapsInstance, // 暴露 Google Maps API 實例 (readonly shallowRef)
  isReady,
  formatBarInfoWindowContent, // <-- 新增：從 useGoogleMaps 導出 formatBarInfoWindowContent
  getPlaceDetails, // <-- 新增：從 useGoogleMaps 導出 getPlaceDetails
} = useGoogleMaps(mapContainer, {
  googleMapsApiKey: googleMapsApiKey,
  mapId: myMapId,
  onError: (msg) => {
    console.error("useGoogleMaps 錯誤:", msg);
    alert(`地圖載入失敗：${msg}，請檢查API Key或網路連線。`);
  },
});

// --- 狀態管理 ---
const isFilterPanelOpen = ref(false);
const searchQuery = ref("");
const suggestions = ref([]);
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
const googleBars = ref([]); // <-- 這個變數將是篩選的來源
const mainBarForSearch = ref(null); // 專門存搜尋主酒吧

// --- Computed Properties ---
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

  // 地址過濾
  if (filters.address !== "any") {
    bars = bars.filter((bar) => bar.address?.includes(filters.address));
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
      if (filters.address !== "any") {
        if (!selectedDistrictTagsFromTagsFilter.includes(filters.address)) {
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

  // 距離過濾 (需要確保 Google Maps geometry 庫已載入)
  if (map && typeof googleMapsInstance === 'function' && googleMapsInstance() && googleMapsInstance().maps && googleMapsInstance().maps.geometry && googleMapsInstance().maps.geometry.spherical) {
    const mapCenter = map.value.getCenter && map.value.getCenter();
    if (mapCenter) {
      const centerLatLng = new googleMapsInstance().LatLng(
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
          const barLatLng = new googleMapsInstance().LatLng(
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

  // 開放時間過濾
  if (
    filters.minOpenHour !== 0 ||
    filters.minOpenMinute !== 0 ||
    filters.maxOpenHour !== 24 ||
    filters.maxOpenMinute !== 0
  ) {
    bars = bars.filter((bar) => {
      // 這裡需要更強健的營業時間解析邏輯，特別是處理 Google Places API 返回的 `periods`
      // 目前的 regex 依賴於 `weekday_text` 的特定格式，這可能不夠穩健
      // 建議改用 `bar.opening_hours.periods` 進行判斷，這需要更複雜的 dayjs 邏輯
      const now = dayjs();
      const currentDayOfWeek = now.day(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

      if (!bar.opening_hours || !bar.opening_hours.periods) return false;

      const filterStart = dayjs()
        .hour(filters.minOpenHour)
        .minute(filters.minOpenMinute);
      let filterEnd = dayjs()
        .hour(filters.maxOpenHour)
        .minute(filters.maxOpenMinute);
      if (filters.maxOpenHour === 24 && filters.maxOpenMinute === 0) {
        filterEnd = filterEnd.endOf("day"); // 24:00 應視為當天結束
      }
      if (filterEnd.isBefore(filterStart)) {
        // 處理過濾器跨午夜
        filterEnd = filterEnd.add(1, "day");
      }

      for (const period of bar.opening_hours.periods) {
        if (period.open && period.close) {
          // 計算營業時間段的 dayjs 物件
          let openTime = dayjs()
            .day(period.open.day)
            .hour(Math.floor(period.open.time / 100))
            .minute(period.open.time % 100);
          let closeTime = dayjs()
            .day(period.close.day)
            .hour(Math.floor(period.close.time / 100))
            .minute(period.close.time % 100);

          if (closeTime.isBefore(openTime)) {
            // 處理酒吧營業時間跨午夜
            closeTime = closeTime.add(1, "day");
          }

          // 檢查酒吧的營業時間段是否與篩選時間段有交集
          // 兩個區間 [A, B] 和 [C, D] 有交集，當且僅當 A <= D 且 B >= C
          const hasIntersection =
            openTime.isBefore(filterEnd) && closeTime.isAfter(filterStart);

          if (hasIntersection) {
            return true;
          }
        }
      }
      return false; // 沒有找到任何符合篩選條件的營業時間段
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
    // 確保 mainBarForSearch 不在已篩選的 bars 中重複添加
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
  isLoading.value = true; // 設置載入狀態
  clearMarkers("all"); // 清除所有舊標記
  closeInfoWindow(); // 關閉資訊視窗

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
              (type) => !COMMON_PLACE_TYPES_TO_EXCLUDE.includes(type) // <-- 這裡使用引入的常數
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
      mainBarForSearch.value = barDetail; // 設置為主搜尋結果
      googleBars.value = [barDetail]; // 將其放入列表，讓 filteredBars 處理
      displayBarsOnMap([barDetail], formatBarInfoWindowContent); // <-- 傳入 formatBarInfoWindowContent
      panTo(detail.geometry.location); // 導航到該地點
    } else {
      alert("無法獲取選定地點的詳細資訊。");
    }
  } catch (error) {
    console.error("選擇建議地點失敗:", error);
    alert("獲取地點詳細資訊失敗，請重試。");
  } finally {
    isLoading.value = false;
  }
}

/**
 * 處理手動搜尋按鈕點擊
 */
async function handleSearch() {
  if (!isReady.value) {
    alert("地圖尚未載入完成，請稍候再試");
    return;
  }
  if (!searchQuery.value) {
    alert("請輸入搜尋關鍵字");
    return;
  }
  isLoading.value = true;
  clearMarkers("all"); // 在每次搜尋開始前，確保徹底清除所有地圖標記。
  closeInfoWindow(); // 同步關閉可能開啟的資訊視窗

  try {
    const mainBars = await searchAndDisplayPlaces(searchQuery.value);

    const fuzzyKeywords = ["bar", "酒吧", "pub", "night club", "cafe"];
    const isFuzzy = fuzzyKeywords.some((k) =>
      searchQuery.value.toLowerCase().includes(k)
    );

    let combinedBars = [];

    if (isFuzzy) {
      // 模糊/熱門關鍵字：直接顯示所有搜尋結果
      mainBarForSearch.value = null;
      combinedBars = mainBars;
    } else {
      // 精確搜尋＋附近 bar
      mainBarForSearch.value =
        mainBars && mainBars.length > 0 ? mainBars[0] : null;
      let relatedBars = [];

      // **主要修改點：確保 mainBarForSearch.value 和其 location 屬性存在**
      // 將 searchNearbyBarsByLocation 的邏輯替換為直接呼叫 Places API 的附近搜尋
      if (mainBarForSearch.value && mainBarForSearch.value.location) {
        let radius = 500; // 初始半徑
        const maxRadius = 3000; // 最大半徑
        const targetNearbyCount = 19; // 目標從附近搜尋獲取多少筆 (20 - 1 主搜尋結果)

        // 使用 PlacesService 進行附近搜尋
        const service = new googleMapsInstance().places.PlacesService(
          map.value
        );
        const barPlaceTypes = [
          "bar",
          "night_club",
          "pub",
          "liquor_store",
          "cafe",
        ]; // 定義酒吧相關類型

        while (radius <= maxRadius && relatedBars.length < targetNearbyCount) {
          const request = {
            location: new googleMapsInstance().LatLng(
              mainBarForSearch.value.location.lat,
              mainBarForSearch.value.location.lng
            ),
            radius: radius,
            type: barPlaceTypes, // 搜尋酒吧相關類型
          };

          const nearbyResults = await new Promise((res, rej) => {
            service.nearbySearch(request, (results, status) => {
              if (
                status ===
                  googleMapsInstance().places.PlacesServiceStatus.OK &&
                results
              ) {
                // 對每個結果獲取詳細資訊
                Promise.all(
                  results.map(async (place) => {
                    try {
                      const detail = await getPlaceDetails(place.place_id);
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
                        priceRange:
                          detail.price_level !== undefined
                            ? `等級 ${detail.price_level}`
                            : null,
                        tags: detail.types
                          ? detail.types.filter(
                              (type) =>
                                !COMMON_PLACE_TYPES_TO_EXCLUDE.includes(type)
                            )
                          : [],
                        opening_hours: detail.opening_hours,
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
                      };
                    } catch (e) {
                      console.warn(`獲取 ${place.name} 詳細資料失敗:`, e);
                      return place;
                    }
                  })
                ).then(res);
              } else if (
                status ===
                googleMapsInstance().places.PlacesServiceStatus.ZERO_RESULTS
              ) {
                res([]);
              } else {
                rej(new Error("Nearby search failed: " + status));
              }
            });
          });

          nearbyResults.forEach((bar) => {
            // 避免重複添加主搜尋結果，以及避免重複添加已找到的附近酒吧
            if (
              bar.place_id !== mainBarForSearch.value.place_id &&
              !relatedBars.some(
                (existingBar) => existingBar.place_id === bar.place_id
              )
            ) {
              relatedBars.push(bar);
            }
          });
          if (relatedBars.length >= targetNearbyCount) break; // 如果找到了足夠的數量，就停止擴大半徑

          radius += 500; // 每次增加 500 公尺
        }
      } else if (mainBars && mainBars.length > 0) {
        // 如果精確搜尋有結果，但第一個結果沒有有效的location（極少數情況），
        // 或者不是精確搜尋但有其他結果，直接將這些結果作為主結果
        combinedBars = mainBars.slice(0, 20); // 取前20個結果
        mainBarForSearch.value = null; // 清除主搜尋結果標識，避免混淆
      }

      combinedBars = [
        ...(mainBarForSearch.value ? [mainBarForSearch.value] : []),
        ...relatedBars,
      ];
      // 限制總結果數為 20 筆
      combinedBars = combinedBars.slice(0, 20);
    }

    // --- 新增：確保所有 bar 物件都帶有 isBarLike 屬性 ---
    const BAR_LIKE_TYPES = ["bar", "night_club", "pub", "liquor_store", "cafe"];
    googleBars.value = combinedBars.map(bar => {
      if (typeof bar.isBarLike === 'boolean') return bar;
      // 根據 tags 或 types 判斷
      const types = bar.tags || bar.types || [];
      return {
        ...bar,
        isBarLike: types.some(type => BAR_LIKE_TYPES.includes(type)),
      };
    });

    // 更新 googleBars，這會觸發 filteredBars 的重新計算
    googleBars.value = googleBars.value;

    if (googleMapsInstance()) {
      if (mainBarForSearch.value && mainBarForSearch.value.location) {
        panTo(mainBarForSearch.value.location, 15); // 移到主搜尋結果並適當縮放
      } else if (googleBars.value.length > 0) {
        // 如果沒有主搜尋結果但有其他結果，嘗試將地圖中心移到第一個結果
        panTo(googleBars.value[0].location, 14);
      } else {
        console.log("搜尋無結果，地圖保持現狀或可考慮重設。");
      }
    }
  } catch (err) {
    mainBarForSearch.value = null;
    googleBars.value = [];
    console.error("搜尋地點失敗:", err);
    alert("搜尋失敗，請稍後再試。");
  } finally {
    isLoading.value = false;
  }
}

/**
 * 處理獲取目前位置
 */
async function handleGetCurrentLocation() {
  try {
    // **重要修改**：在每次獲取目前位置開始前，確保徹底清除所有地圖標記。
    clearMarkers("all"); // 清除所有舊標記，包括搜尋結果和現有位置
    closeInfoWindow(); // 同步關閉可能開啟的資訊視窗

    // 側邊欄寬度用於調整地圖中心，以確保定位點在可視區域
    const sidebarWidth =
      document.querySelector(".bar-list-sidebar")?.offsetWidth || 0;
    const currentLocation = await getMapCurrentLocation(sidebarWidth);

    // 獲取到當前位置後，自動搜尋附近酒吧
    if (currentLocation) {
      isLoading.value = true;
      // 直接使用 searchBarsInMapBounds，它會基於地圖當前可視範圍進行搜尋
      // 如果 getCurrentLocation 後地圖中心已經移動，那麼 searchBarsInMapBounds 會自動使用新的中心範圍
      const nearbyBars = await searchBarsInMapBounds(true);
      googleBars.value = nearbyBars;
      // displayBarsOnMap 會在 filteredBars watch 中自動處理
      isLoading.value = false;
    }
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
  // 當篩選器變化時，filteredBars 會自動重新計算，並觸發 displayBarsOnMap
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
  // 若 bar 已有 googleReviews，直接顯示；否則自動補抓詳細資料
  if (bar.place_id && (!bar.googleReviews || bar.googleReviews.length === 0)) {
    try {
      const detail = await getPlaceDetails(bar.place_id);
      if (detail && detail.reviews) {
        bar.googleReviews = detail.reviews;
      }
    } catch (e) {
      console.warn('自動補抓 Google 評論失敗', e);
    }
  }
  selectedBarForDetail.value = bar || {};
  isBarDetailModalOpen.value = true;
  if (bar.location && map && googleMapsInstance()) {
    panTo(bar.location);
    const tempMarker = new googleMapsInstance().Marker({
      position: new googleMapsInstance().LatLng(
        bar.location.lat,
        bar.location.lng
      ),
      map: map,
      title: bar.name,
      icon: {
        url: "/wine.png",
        scaledSize: new googleMapsInstance().Size(40, 40),
        anchor: new googleMapsInstance().Point(20, 40),
      },
    });
    const infoContent = formatBarInfoWindowContent(bar);
    showInfoWindow(tempMarker, infoContent);
  }
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
  const barIndex = googleBars.value.findIndex((b) => b.place_id === barId); // 使用 place_id
  if (barIndex > -1) {
    // 創建一個新的物件來觸發響應式更新
    const updatedBar = { ...googleBars.value[barIndex] };
    updatedBar.isWishlisted = !updatedBar.isWishlisted;
    // 替換陣列中的物件，以確保 Vue 偵測到變化
    googleBars.value.splice(barIndex, 1, updatedBar);
  }
  // 如果詳細資訊彈窗打開，也更新其狀態
  if (
    selectedBarForDetail.value &&
    selectedBarForDetail.value.place_id === barId
  ) {
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
watch(
  mapContainer,
  (newVal) => {
    if (newVal && typeof googleMapsInstance === 'function' && googleMapsInstance()) {
      console.log("mapContainer DOM 元素已準備好且 Google Maps API 已載入。嘗試初始化地圖...");
      initMap();
    }
  },
  { immediate: true }
);

// 監聽地圖初始化完成
watch(isReady, (ready) => {
  if (ready && map && typeof googleMapsInstance === 'function' && googleMapsInstance()) {
    console.log("地圖初始化完成，添加事件監聽器。");
    const onMapIdleHandler = async () => {
      if (!isFetching.value && !isLoading.value) {
        console.log("地圖閒置，重新搜尋範圍內的酒吧。");
        const barsInBounds = await searchBarsInMapBounds(false);
        googleBars.value = barsInBounds;
      }
    };
    if (map.value && map.value.addListener) {
      map.value.addListener("idle", onMapIdleHandler);
    }
  }
});

// 監聽 filteredBars 變化，更新地圖上的酒吧標記
watch(
  filteredBars,
  (newBars) => {
    if (map && typeof googleMapsInstance === 'function' && googleMapsInstance()) {
      console.log(`filteredBars 變更，準備顯示 ${newBars.length} 個酒吧標記。`);
      displayBarsOnMap(newBars, formatBarInfoWindowContent);
    } else {
      console.warn("地圖或 Google Maps 實例未準備好，無法顯示酒吧標記。");
    }
  },
  { immediate: false }
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

    // 2. 強制初始化地圖
    await initMap();

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
  transition: background-color 0.2s, transform 0.2s;
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
  min-height: 400px;
  border: 2px solid red;
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