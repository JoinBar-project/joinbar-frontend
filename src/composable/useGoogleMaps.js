import { ref, shallowRef, readonly } from "vue";

export function useGoogleMaps(mapContainerRef, options) {
  const {
    googleMapsApiKey,
    onLoading,
    onLoaded,
    onError,
    mapId,
    onMapIdle,
  } = options;

  const map = shallowRef(null);
  const markers = ref([]);
  const searchMarkers = ref([]);
  const infoWindow = shallowRef(null);
  const google = shallowRef(null);
  const loading = ref(true);
  const isFetching = ref(false);
  const isReady = ref(false);

  let placesService = null;
  let autocompleteService = null;
  let geocoderService = null;
  let directionsService = null;
  let directionsRenderer = null;

  const barIconUrl = '/wine.png';
  const nowIconUrl = '/now.png';

  /**
   * 載入 Google Maps JavaScript API
   */
  const loadGoogleMapsAPI = async () => {
    if (google.value) {
      loading.value = false;
      onLoaded && onLoaded();
      return;
    }
    loading.value = true;
    onLoading && onLoading();
    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector(
        `script[src*="maps.googleapis.com/maps/api/js"]`
      );
      if (existingScript) {
        if (window.google && window.google.maps) {
          google.value = window.google.maps;
          loading.value = false;
          onLoaded && onLoaded();
          resolve();
        } else {
          if (!window.initMapCallback) {
            window.initMapCallback = () => {
              google.value = window.google.maps;
              loading.value = false;
              onLoaded && onLoaded();
              resolve();
            };
          }
          if (!existingScript.src.includes("callback=initMapCallback")) {
            existingScript.src += "&callback=initMapCallback";
          }
        }
        return;
      }
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places,geometry,marker&callback=initMapCallback`;
      script.async = true;
      script.defer = true;
      if (!window.initMapCallback) {
        window.initMapCallback = () => {
          google.value = window.google.maps;
          loading.value = false;
          onLoaded && onLoaded();
          resolve();
        };
      }
      script.onerror = (e) => {
        loading.value = false;
        const errorMessage = "Google Maps API 載入失敗";
        onError && onError(errorMessage);
        reject(new Error(errorMessage));
      };
      document.head.appendChild(script);
    });
  };

  /**
   * 初始化地圖
   */
  const initMap = () => {
    if (!(mapContainerRef.value instanceof HTMLElement)) {
      const errorMessage = "地圖容器未準備好或不是有效的 DOM 元素。";
      console.error(errorMessage, mapContainerRef.value);
      onError && onError(errorMessage);
      return;
    }
    if (!google.value) {
      const errorMessage = "Google Maps API 未載入。";
      console.error(errorMessage);
      onError && onError(errorMessage);
      return;
    }
    if (map.value) {
      console.log("地圖已初始化，跳過重複初始化。");
      return;
    }
    const defaultTaipei = { lat: 25.033964, lng: 121.564472 };
    try {
      map.value = new google.value.Map(mapContainerRef.value, {
        center: defaultTaipei,
        zoom: 14,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        mapId: mapId || "YOUR_MAP_ID",
        restriction: {
          latLngBounds: {
            north: 26.5,
            south: 21.5,
            west: 119.0,
            east: 123.0,
          },
          strictBounds: false,
        },
        scrollwheel: true,
      });
      placesService = new google.value.places.PlacesService(map.value);
      autocompleteService = new google.value.places.AutocompleteService();
      geocoderService = new google.value.Geocoder();
      directionsService = new google.value.DirectionsService();
      directionsRenderer = new google.value.DirectionsRenderer();
      directionsRenderer.setMap(map.value);
      infoWindow.value = new google.value.InfoWindow({
        content: "",
        pixelOffset: new google.value.Size(0, -30),
      });
      map.value.addListener("idle", () => {
        if (onMapIdle && typeof onMapIdle === "function") {
          onMapIdle();
        }
      });
      isReady.value = true;
      console.log("地圖初始化完成，服務已載入");
    } catch (error) {
      const errorMessage = `地圖初始化失敗: ${error.message}`;
      console.error(errorMessage, error);
      onError && onError(errorMessage);
    }
  };

  /**
   * 請求地理位置權限 (僅為示意，實際獲取在 getCurrentLocation)
   */
  const requestGeolocationPermission = () => {
    if (!navigator.geolocation) {
      console.warn("瀏覽器不支援地理位置功能。");
      return;
    }
  };

  /**
   * 取得目前位置並在地圖上顯示標記
   * @param {number} offsetWidth - 側邊欄寬度，用於調整地圖中心
   */
  const getCurrentLocation = (offsetWidth = 0) => {
    isFetching.value = true; // 開始獲取位置，顯示載入中
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        isFetching.value = false;
        const msg = "瀏覽器不支援地理位置功能。";
        onError && onError(msg);
        reject(new Error(msg));
        return;
      }
      if (!map.value || !google.value) {
        isFetching.value = false;
        const msg = "地圖或 Google Maps API 未初始化。";
        onError && onError(msg);
        reject(new Error(msg));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          clearMarkers("search"); // 清除之前的搜尋標記

          addMarker(
            {
              location: pos,
              title: "您的目前位置",
              icon: {
                url: nowIconUrl, // 使用 now.png
                scaledSize: new google.value.Size(40, 40),
                anchor: new google.value.Point(20, 20),
              },
              infoContent: "您現在在這裡！",
              isCurrentLocation: true,
            },
            "search"
          );

          panTo(pos, 15, offsetWidth); // 平移並縮放地圖到當前位置
          isFetching.value = false; // 載入完成
          resolve(pos);
        },
        (error) => {
          isFetching.value = false; // 載入失敗
          let msg = "";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              msg = "使用者拒絕了地理位置請求。";
              break;
            case error.POSITION_UNAVAILABLE:
              msg = "位置資訊無法取得。";
              break;
            case error.TIMEOUT:
              msg = "請求使用者位置超時。";
              break;
            case error.UNKNOWN_ERROR:
              msg = "發生未知錯誤。";
              break;
          }
          console.error("獲取目前位置失敗:", error);
          onError && onError(msg);
          reject(new Error(msg));
        }
      );
    });
  };

  /**
   * 新增一個標記到地圖
   * @param {object} options - 標記選項，包含 location, title, icon, infoContent, data, isCurrentLocation, isBarLike
   * @param {string} type - 'bars' 或 'search'，決定標記存儲在哪個陣列
   * @returns {google.maps.Marker} 新增的標記物件
   */
  const addMarker = (options, type = "bars") => {
    if (!map.value || !google.value) return null;

    const position = new google.value.LatLng(
      options.location.lat,
      options.location.lng
    );
    const markerOptions = {
      position: position,
      map: map.value,
      title: options.title,
    };

    if (options.isCurrentLocation) {
      markerOptions.icon = {
        url: nowIconUrl, // 使用 now.png
        scaledSize: new google.value.Size(40, 40),
        anchor: new google.value.Point(20, 20),
      };
    } else if (options.isBarLike) {
      markerOptions.icon = {
        url: barIconUrl, // 只針對 bar 類型用 wine.png
        scaledSize: new google.value.Size(40, 40),
        anchor: new google.value.Point(20, 40),
      };
    }
    // 其他型態不設 icon，使用 Google 預設

    const marker = new google.value.Marker(markerOptions);

    if (options.infoContent || options.data) {
      if (infoWindow.value) {
        marker.addListener("click", () => {
          const content =
            options.infoContent || formatBarInfoWindowContent(options.data);
          showInfoWindow(marker, content);
        });
      } else {
        console.warn("InfoWindow 未初始化，無法為標記添加點擊事件。");
      }
    }

    if (type === "bars") {
      markers.value.push(marker);
    } else if (type === "search") {
      searchMarkers.value.push(marker);
    }
    return marker;
  };

  /**
   * 清除特定類型或所有標記
   * @param {string} type - 'bars', 'search', 或 'all'
   */
  const clearMarkers = (type = "all") => {
    if (type === "bars" || type === "all") {
      markers.value.forEach((marker) => {
        if (marker) marker.setMap(null);
      });
      markers.value = [];
    }
    if (type === "search" || type === "all") {
      searchMarkers.value.forEach((marker) => {
        if (marker) marker.setMap(null);
      });
      searchMarkers.value = [];
    }
    closeInfoWindow(); // 清除標記時也關閉資訊視窗
  };

  /**
   * 顯示資訊視窗
   * @param {google.maps.Marker} marker - 要綁定資訊視窗的標記
   * @param {string} content - 資訊視窗的 HTML 內容
   */
  const showInfoWindow = (marker, content) => {
    if (infoWindow.value && map.value) {
      infoWindow.value.setContent(content);
      infoWindow.value.open(map.value, marker);
    }
  };

  /**
   * 關閉資訊視窗
   */
  const closeInfoWindow = () => {
    if (infoWindow.value) {
      infoWindow.value.close();
    }
  };

  /**
   * 平移地圖到指定位置並可選縮放
   * @param {object} latLng - {lat: number, lng: number}
   * @param {number} zoomLevel - 縮放級別 (可選)
   * @param {number} offsetWidth - 偏移量 (例如側邊欄寬度)
   */
  const panTo = (latLng, zoomLevel = null, offsetWidth = 0) => {
    if (!map.value || !google.value) return;

    map.value.panTo(latLng);

    if (zoomLevel) {
      map.value.setZoom(zoomLevel);
    }

    if (offsetWidth > 0) {
      google.value.maps.event.addListenerOnce(map.value, "idle", () => {
        const offset = offsetWidth / 2;
        map.value.panBy(-offset, 0); // 朝左平移，讓地圖中心在側邊欄右側
      });
    }
  };

  /**
   * 設定地圖縮放級別
   * @param {number} level - 縮放級別
   */
  const setZoom = (level) => {
    if (map.value) {
      map.value.setZoom(level);
    }
  };

  /**
   * 在地圖上顯示酒吧標記（此函數用於處理 allBars 數據，通常來自 Places API 的 searchBarsInMapBounds）
   * @param {Array} bars - 酒吧數據陣列
   */
  const displayBarsOnMap = (bars) => {
    if (!map.value || !google.value) {
      console.warn("地圖或 Google 實例未準備好，無法顯示酒吧標記。");
      return;
    }

    clearMarkers("bars"); // 清除舊的酒吧標記

    if (!bars || bars.length === 0) {
      console.log("沒有酒吧數據可供顯示。");
      return;
    }

    const bounds = new google.value.LatLngBounds();

    bars.forEach((bar) => {
      if (bar.location && bar.location.lat && bar.location.lng) {
        const marker = addMarker(
          {
            location: bar.location,
            title: bar.name,
            data: bar,
            isBarLike: true, // 標記為酒吧類型，以便 addMarker 應用自定義圖標
          },
          "bars"
        );
        if (marker) {
          bounds.extend(marker.getPosition());
        }
      } else {
        console.warn(`酒吧 ${bar.name} 缺少有效的地理位置資訊。`);
      }
    });

    if (!bounds.isEmpty()) {
      if (bars.length === 1) {
        map.value.panTo(bounds.getCenter());
        map.value.setZoom(15);
      } else {
        map.value.fitBounds(bounds);
        // 檢查 fitBounds 後縮放級別是否過大，防止地圖過度放大
        if (map.value.getZoom() > 17) {
          map.value.setZoom(17);
        }
      }
    }
  };

  /**
   * 獲取地點自動完成建議
   * @param {string} input - 使用者輸入的搜尋文字
   * @returns {Promise<Array>} 建議列表
   */
  const getPlacePredictions = async (input) => {
    if (!autocompleteService) {
      console.error("AutocompleteService 未初始化。");
      return [];
    }
    try {
      const { predictions } = await autocompleteService.getPlacePredictions({
        input: input,
        // 優先在當前地圖可視範圍內搜尋，如果地圖未初始化則不指定
        bounds: map.value ? map.value.getBounds() : undefined,
        componentRestrictions: { country: "tw" }, // 限制在台灣
        types: ["establishment", "geocode"], // 搜尋商家或地理編碼
      });
      return predictions;
    } catch (error) {
      console.error("獲取地點建議失敗:", error);
      return [];
    }
  };

  /**
   * 取得 Google Place 詳細資料
   * @param {string} placeId
   * @returns {Promise<object>} 詳細資料
   */
  const getPlaceDetails = (placeId) => {
    return new Promise((resolve, reject) => {
      if (!placesService || !google.value) {
        reject(new Error("PlacesService 未初始化"));
        return;
      }
      const request = {
        placeId,
        fields: [
          "name",
          "geometry",
          "formatted_address",
          "place_id",
          "icon",
          "photos",
          "rating",
          "user_ratings_total",
          "opening_hours",
          "types",
          "url",
          "reviews",
          "international_phone_number",
          "website",
          "price_level",
        ],
      };
      placesService.getDetails(request, (place, status) => {
        if (status === google.value.places.PlacesServiceStatus.OK && place) {
          resolve(place);
        } else {
          reject(new Error("取得詳細資料失敗: " + status));
        }
      });
    });
  };

  /**
   * 根據搜尋字串搜尋地點並在地圖上顯示標記
   * @param {string} query - 搜尋字串
   * @returns {Promise<Array>} 搜尋結果 Places API 物件
   */
  const searchAndDisplayPlaces = async (query) => {
    if (!placesService || !google.value) {
      const errorMessage = "PlacesService 或 Google Maps API 未初始化。";
      console.error(errorMessage);
      onError && onError(errorMessage);
      return [];
    }

    isFetching.value = true; // 開始搜尋，顯示載入中
    clearMarkers("all"); // 清空所有標記

    return new Promise((resolve, reject) => {
      const request = {
        query: query,
        fields: [
          "name",
          "geometry",
          "formatted_address",
          "place_id",
          "icon",
          "photos",
          "rating",
          "user_ratings_total",
          "opening_hours",
          "types",
          "url",
        ],
        bounds: map.value ? map.value.getBounds() : undefined, // 優先在當前地圖範圍內搜尋
        strictBounds: false,
      };

      placesService.textSearch(request, async (results, status) => {
        isFetching.value = false; // 搜尋完成，關閉載入中

        if (status === google.value.places.PlacesServiceStatus.OK && results) {
          const bounds = new google.value.LatLngBounds();
          results.forEach((place) => {
            if (place.geometry && place.geometry.location) {
              addMarker(
                {
                  location: {
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                  },
                  title: place.name,
                  infoContent: formatBarInfoWindowContent({
                    name: place.name,
                    address: place.formatted_address,
                    rating: place.rating,
                    reviews: place.user_ratings_total,
                    openingHours: place.opening_hours,
                    imageUrl:
                      place.photos && place.photos.length > 0
                        ? place.photos[0].getUrl({
                            maxWidth: 400,
                            maxHeight: 400,
                          })
                        : "",
                    tags: place.types,
                    description: "這是搜尋到的地點。",
                    url: place.url,
                  }),
                  icon: place.icon,
                },
                "search"
              );
              bounds.extend(place.geometry.location);
            }
          });

          if (!bounds.isEmpty()) {
            map.value.fitBounds(bounds);
            if (map.value.getZoom() > 17) {
              map.value.setZoom(17);
            }
          }

          // 取得詳細資料
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
                          !["point_of_interest", "establishment"].includes(type)
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
              } catch (e) {
                return place;
              }
            })
          ).then((detailedBars) => {
            resolve(detailedBars);
          });
        } else if (
          status === google.value.places.PlacesServiceStatus.ZERO_RESULTS
        ) {
          console.log("未找到搜尋結果。");
          resolve([]);
        } else {
          const errorMessage = `Places 搜尋失敗: ${status}`;
          console.error(errorMessage, results);
          onError && onError(errorMessage);
          reject(new Error(errorMessage));
        }
      });
    });
  };

  /**
   * 根據地圖可視範圍搜尋酒吧或其他指定類型地點
   * @param {boolean} showLoadingOverlay - 是否顯示載入中遮罩（此參數現在主要用於控制 isFetching）
   * @returns {Promise<Array>} 格式化後的酒吧數據陣列
   */
  const searchBarsInMapBounds = async (showLoadingOverlay = true) => {
    if (!map.value || !placesService || !google.value) {
      console.warn("地圖、PlacesService 或 Google Maps API 未準備好。");
      return [];
    }

    if (showLoadingOverlay) {
      isFetching.value = true;
    }
    clearMarkers("bars"); // 清除舊的酒吧標記

    const bounds = map.value.getBounds();
    if (!bounds) {
      if (showLoadingOverlay) {
        isFetching.value = false;
      }
      console.warn("無法取得地圖邊界。");
      return [];
    }

    const request = {
      bounds: bounds,
      type: ["bar", "night_club", "pub", "liquor_store", "cafe"],
      rankBy: google.value.places.RankBy.PROMINENCE,
    };

    return new Promise((resolve, reject) => {
      placesService.nearbySearch(request, async (results, status) => {
        if (showLoadingOverlay) {
          isFetching.value = false;
        }
        if (status === google.value.places.PlacesServiceStatus.OK && results) {
          // 取得詳細資料
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
                          !["point_of_interest", "establishment"].includes(type)
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
              } catch (e) {
                return place;
              }
            })
          ).then((detailedBars) => {
            resolve(detailedBars);
          });
        } else if (
          status === google.value.places.PlacesServiceStatus.ZERO_RESULTS
        ) {
          console.log("當前地圖範圍內沒有找到相關酒吧。");
          resolve([]);
        } else {
          const errorMessage = `Nearby Places 搜尋失敗: ${status}`;
          console.error(errorMessage, results);
          onError && onError(errorMessage);
          reject(new Error(errorMessage));
        }
      });
    });
  };

  /**
   * 平移地圖到指定酒吧位置並顯示其資訊視窗
   * @param {object} bar - 酒吧數據物件 (通常是 MapView 中格式化後的 bar 對象)
   */
  const panToAndShowBarInfo = (bar) => {
    if (!map.value || !google.value || !bar.location) {
      console.warn("無法顯示酒吧資訊，地圖、Google實例或酒吧位置資訊缺失。");
      return;
    }

    const targetLatLng = new google.value.LatLng(
      bar.location.lat,
      bar.location.lng
    );
    map.value.panTo(targetLatLng);
    map.value.setZoom(16); // 設置一個適當的縮放級別

    // 嘗試找到地圖上已存在的該酒吧的標記
    const targetMarker = markers.value.find(
      (m) =>
        m.getPosition().lat().toFixed(6) === targetLatLng.lat().toFixed(6) &&
        m.getPosition().lng().toFixed(6) === targetLatLng.lng().toFixed(6) &&
        m.getTitle() === bar.name // 假設 title 和 name 總是匹配
    );

    if (targetMarker) {
      showInfoWindow(targetMarker, formatBarInfoWindowContent(bar));
    } else {
      // 如果沒有找到現有標記（可能是用戶直接點擊列表項而不是地圖標記），則創建一個臨時標記來顯示資訊視窗
      const tempMarker = new google.value.Marker({
        position: targetLatLng,
        map: map.value,
        title: bar.name,
        // *** 這裡也使用傳入的 barIconUrl ***
        icon: barIconUrl
          ? {
              url: barIconUrl,
              scaledSize: new google.value.Size(40, 40),
              anchor: new google.value.Point(20, 40),
            }
          : "http://maps.google.com/mapfiles/ms/icons/red-dot.png", // 預設紅色點
      });
      showInfoWindow(tempMarker, formatBarInfoWindowContent(bar));
      // 確保在 infoWindow 關閉時移除臨時標記
      const listener = google.value.maps.event.addListener(
        infoWindow.value,
        "closeclick",
        function () {
          tempMarker.setMap(null); // 從地圖上移除臨時標記
          google.value.maps.event.removeListener(listener); // 移除監聽器避免記憶體洩漏
        }
      );
    }
  };

  /**
   * 判斷地點類型是否與酒吧相關 (這個函數主要用於內部邏輯或顯示篩選)
   * @param {string} type - 地點類型字串
   * @returns {boolean}
   */
  const isBarLike = (type) => {
    const barTypes = ["bar", "night_club", "pub", "liquor_store", "cafe"]; // 可以擴展更多類型
    return barTypes.includes(type);
  };

  /**
   * 格式化酒吧資訊視窗的 HTML 內容
   * @param {object} bar - 酒吧數據物件 (預期是 MapView 中處理後的物件)
   * @returns {string} HTML 內容
   */
  const formatBarInfoWindowContent = (bar) => {
    if (!bar) return "<div>無資訊</div>";

    const openingHoursText =
      bar.opening_hours?.weekday_text?.[0] || "無營業時間資訊";
    const tagsHtml =
      bar.tags && bar.tags.length > 0
        ? `<div class="info-window-tags-container">${bar.tags.map((tag) => `<span class="info-window-tag">${tag}</span>`).join("")}</div>`
        : "";
    const imageUrl = bar.imageUrl || "";
    // 更新 Google Maps URL，使用 place_id 可以更精確地導航到地點
    const placeUrl =
      bar.url ||
      (bar.place_id
        ? `https://www.google.com/maps/search/?api=1&query_place_id=${bar.place_id}`
        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(bar.name)}&ll=${bar.location?.lat},${bar.location?.lng}`);

    return `
            <div class="info-window-content">
                <h3 class="info-window-title">${bar.name || "未知酒吧"}</h3>
                ${imageUrl ? `<img src="${imageUrl}" alt="${bar.name}" class="info-window-image">` : ""}
                <p class="info-window-meta">⭐ ${bar.rating || "N/A"} (${bar.reviews || 0} 評論)</p>
                <p class="info-window-meta">📍 ${bar.address || "未知地址"}</p>
                <p class="info-window-meta">⏰ ${openingHoursText}</p>
                ${tagsHtml}
                <p class="info-window-description">${bar.description || "點擊查看更多詳情..."}</p>
                <p><a href="${placeUrl}" target="_blank" rel="noopener noreferrer">在 Google 地圖中查看</a></p>
            </div>
        `;
  };

  /**
   * 計算兩點之間的距離 (米)
   * @param {object} latLng1 - {lat: number, lng: number}
   * @param {object} latLng2 - {lat: number, lng: number}
   * @returns {number} 距離 (米)
   */
  const calculateDistance = (latLng1, latLng2) => {
    if (
      !google.value ||
      !google.value.maps.geometry ||
      !google.value.maps.geometry.spherical
    ) {
      console.warn("Google Maps Geometry library 未載入。無法計算距離。");
      return 0;
    }
    const p1 = new google.value.LatLng(latLng1.lat, latLng1.lng);
    const p2 = new google.value.LatLng(latLng2.lat, latLng2.lng);
    return google.value.maps.geometry.spherical.computeDistanceBetween(p1, p2);
  };

  /**
   * 取得地圖目前可視範圍的中心點
   * @returns {object|null} {lat: number, lng: number} 或 null
   */
  const getBoundsCenter = () => {
    if (map.value && map.value.getBounds()) {
      const center = map.value.getBounds().getCenter();
      return { lat: center.lat(), lng: center.lng() };
    }
    return null;
  };

  /**
   * 以指定座標搜尋附近酒吧（正確多頁，僅回傳前10筆）
   * @param {object} location {lat, lng}
   * @param {number} radius 公尺
   * @param {number} maxPages 最多抓幾頁
   * @returns {Promise<Array>} 附近酒吧
   */
  const searchNearbyBarsByLocation = async (location, radius = 500, maxPages = 3) => {
    if (!placesService || !google.value) return [];
    let allResults = [];
    let page = 0;
    return new Promise((resolve) => {
      const request = {
        location: new google.value.LatLng(location.lat, location.lng),
        radius,
        type: ["bar", "night_club", "pub", "liquor_store", "cafe"],
      };
      const handleResults = (results, status, pagination) => {
        if (status === google.value.places.PlacesServiceStatus.OK && results) {
          allResults = allResults.concat(results);
          page++;
          if (pagination && pagination.hasNextPage && page < maxPages) {
            setTimeout(() => {
              pagination.nextPage();
            }, 2000);
          } else {
            console.log('allResults', allResults)
            Promise.all(
              allResults.map(async (place) => {
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
                            !["point_of_interest", "establishment"].includes(type)
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
                } catch (e) {
                  return place;
                }
              })
            ).then((detailedBars) => {
              resolve(detailedBars);
            });
          }
        } else {
          allResults = allResults.slice(0, 10);
          Promise.all(
            allResults.map(async (place) => {
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
                          !["point_of_interest", "establishment"].includes(type)
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
              } catch (e) {
                return place;
              }
            })
          ).then((detailedBars) => {
            resolve(detailedBars);
          });
        }
      };
      placesService.nearbySearch(request, handleResults);
    });
  };

  return {
    map: readonly(map),
    markers: readonly(markers),
    searchMarkers: readonly(searchMarkers),
    infoWindow: readonly(infoWindow),
    loading: readonly(loading),
    isFetching: readonly(isFetching),
    isReady,
    loadGoogleMapsAPI,
    initMap,
    showInfoWindow,
    closeInfoWindow,
    panTo,
    setZoom,
    displayBarsOnMap,
    requestGeolocationPermission,
    getCurrentLocation,
    getPlacePredictions,
    searchAndDisplayPlaces,
    panToAndShowBarInfo,
    searchBarsInMapBounds,
    searchNearbyBarsByLocation,
    google: readonly(google),
    clearMarkers,
    calculateDistance,
    getBoundsCenter,
  };
}
