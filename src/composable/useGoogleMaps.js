// useGoogleMaps.js
import { ref, shallowRef, onUnmounted } from "vue";

let googleMapsLoading = false;
let googleMapsLoaded = false;
let googleMapsLoadPromise = null;

/**
 * Google Maps 相關功能的 Composition API Hook。
 * @param {Ref<HTMLElement>} mapContainerRef - 地圖容器的 Vue ref。
 * @param {Object} options - 配置選項。
 * @param {string} options.googleMapsApiKey - Google Maps API Key。
 * @param {string} [options.mapId] - 自定義地圖的 Map ID。
 * @param {Object} [options.defaultCenter={ lat: 25.033, lng: 121.5654 }] - 地圖預設中心點。
 * @param {number} [options.defaultZoom=12] - 地圖預設縮放等級。
 * @param {Object} [options.mapRestrictions] - 地圖邊界限制。
 * @param {Object} [options.mapControls] - 地圖控制項顯示設定。
 * @param {Array<Object>} [options.mapStyles] - 地圖樣式陣列。
 */
export function useGoogleMaps(mapContainerRef, options) {
  const {
    googleMapsApiKey,
    mapId, // 接收 mapId
    defaultCenter = { lat: 25.033, lng: 121.5654 },
    defaultZoom = 12,
    mapRestrictions, // 接收地圖邊界限制
    mapControls, // 接收地圖控制項設定
    mapStyles, // 接收地圖樣式
  } = options;

  const map = shallowRef(null);
  const infoWindow = shallowRef(null);
  const autocompleteService = shallowRef(null);
  const placesService = shallowRef(null);
  const geocoder = shallowRef(null);
  const currentMarker = shallowRef(null);

  const markers = ref([]);
  const searchMarkers = ref([]);
  const loading = ref(false);
  const error = ref(null);

  let skipNextIdle = false; // 用於避免 panTo/setZoom 後立即觸發 idle 事件

  /**
   * 輔助函數：判斷是否為酒吧類型。
   */
  const isBarLike = (place) => {
    const nameLower = place.name ? place.name.toLowerCase() : "";
    const types = place.types || [];
    const tags = place.tags || []; // 假設 place 可能有 tags

    const hasBarType = types.some(
      (type) =>
        type === "bar" ||
        type === "night_club" ||
        type === "liquor_store" ||
        type === "restaurant" // 有些餐廳也可能有酒
    );
    const hasBarKeywordInName =
      nameLower.includes("bar") ||
      nameLower.includes("酒吧") ||
      nameLower.includes("酒館") ||
      nameLower.includes("居酒屋");
    const hasBarTag = tags.some(
      (tag) =>
        tag.includes("酒吧") ||
        tag.includes("酒館") ||
        tag.includes("居酒屋") ||
        tag.includes("精釀啤酒") ||
        tag.includes("調酒")
    );
    return hasBarType || hasBarKeywordInName || hasBarTag;
  };

  /**
   * 載入 Google Maps JavaScript API 腳本 (單例模式)。
   */
  const loadGoogleMapsAPI = () => {
    if (googleMapsLoaded && window.google && window.google.maps) {
      return Promise.resolve(window.google.maps);
    }
    if (googleMapsLoading && googleMapsLoadPromise) {
      return googleMapsLoadPromise;
    }

    googleMapsLoading = true;
    loading.value = true;
    error.value = null;

    googleMapsLoadPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector(
        'script[src*="maps.googleapis.com"]'
      );
      if (existingScript) {
        if (window.google && window.google.maps) {
          googleMapsLoaded = true;
          googleMapsLoading = false;
          loading.value = false;
          resolve(window.google.maps);
          return;
        }
        existingScript.addEventListener("load", () => {
          googleMapsLoaded = true;
          googleMapsLoading = false;
          loading.value = false;
          resolve(window.google.maps);
        });
        existingScript.addEventListener("error", () => {
          const errMsg =
            "Google Maps API script failed to load (existing script).";
          error.value = errMsg;
          loading.value = false;
          googleMapsLoading = false;
          reject(new Error(errMsg));
        });
        return;
      }

      if (!googleMapsApiKey) {
        const errMsg = "Google Maps API Key is not configured.";
        error.value = errMsg;
        loading.value = false;
        googleMapsLoading = false;
        reject(new Error(errMsg));
        return;
      }

      // 注意：這裡加入了 mapIds 和 v=beta 以支援 Map ID
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places,geometry&v=beta&solution_channel=GMP_CCS_complexmarkers_v3${mapId ? "&map_ids=" + mapId : ""}`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        googleMapsLoaded = true;
        googleMapsLoading = false;
        loading.value = false;

        // 加載 extended-component-library
        const extScript = document.createElement("script");
        extScript.type = "module";
        extScript.src =
          "https://ajax.googleapis.com/ajax/libs/@googlemaps/extended-component-library/0.6.11/index.min.js";
        extScript.onload = () => resolve(window.google.maps);
        extScript.onerror = () => {
          const errMsg = "Extended Component Library script failed to load.";
          error.value = errMsg;
          loading.value = false;
          googleMapsLoading = false;
          reject(new Error(errMsg));
        };
        document.head.appendChild(extScript);
      };
      script.onerror = () => {
        const errMsg = "Google Maps API script failed to load.";
        error.value = errMsg;
        loading.value = false;
        googleMapsLoading = false;
        reject(new Error(errMsg));
      };
      document.head.appendChild(script);
    });
    return googleMapsLoadPromise;
  };

  /**
   * 初始化 Google Map 實例與相關服務。
   */
  const initMap = (
    initialCenter = defaultCenter,
    initialZoom = defaultZoom
  ) => {
    if (!mapContainerRef.value || !window.google || !window.google.maps) {
      error.value = "地圖容器或 API 未載入。";
      return;
    }

    // 合併預設地圖選項與傳入的客製化選項
    const defaultMapOptions = {
      center: initialCenter,
      zoom: initialZoom,
      gestureHandling: "greedy",
      mapTypeControl: false,
      zoomControl: true, // 預設顯示縮放按鈕
      scaleControl: false,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: false,
      // 預設樣式，如果沒有 mapId 或 mapStyles，則隱藏 POI labels
      styles: mapId
        ? undefined
        : [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
    };

    const finalMapOptions = {
      ...defaultMapOptions,
      ...(mapId && { mapId: mapId }), // 如果有 mapId，則添加
      ...(mapRestrictions && { restriction: mapRestrictions }), // 如果有邊界限制，則添加
      ...(mapControls && {
        // 如果有控制項設定，則覆寫
        mapTypeControl:
          mapControls.mapTypeControl ?? defaultMapOptions.mapTypeControl,
        zoomControl: mapControls.zoomControl ?? defaultMapOptions.zoomControl,
        scaleControl:
          mapControls.scaleControl ?? defaultMapOptions.scaleControl,
        streetViewControl:
          mapControls.streetViewControl ?? defaultMapOptions.streetViewControl,
        rotateControl:
          mapControls.rotateControl ?? defaultMapOptions.rotateControl,
        fullscreenControl:
          mapControls.fullscreenControl ?? defaultMapOptions.fullscreenControl,
      }),
      ...(mapStyles && { styles: mapStyles }), // 如果有傳入 styles，則覆寫
    };

    map.value = new window.google.maps.Map(
      mapContainerRef.value,
      finalMapOptions
    );

    infoWindow.value = new window.google.maps.InfoWindow();
    placesService.value = new window.google.maps.places.PlacesService(
      map.value
    );
    autocompleteService.value =
      new window.google.maps.places.AutocompleteService();
    geocoder.value = new window.google.Geocoder();
  };

  /**
   * 清除地圖上的標記。
   * @param {'all' | 'bars' | 'search' | 'currentLocation'} [type='all'] - 要清除的標記類型。
   */
  const clearMarkers = (type = "all") => {
    if (type === "bars" || type === "all") {
      markers.value.forEach((marker) => marker.setMap(null));
      markers.value = [];
    }
    if (type === "search" || type === "all") {
      searchMarkers.value.forEach((marker) => marker.setMap(null));
      searchMarkers.value = [];
    }
    if (type === "currentLocation" || type === "all") {
      if (currentMarker.value) {
        currentMarker.value.setMap(null);
        currentMarker.value = null; // 清除 currentMarker 實例
      }
    }
  };

  /**
   * 在地圖上添加一個標記。
   * @param {google.maps.LatLngLiteral | google.maps.LatLng} position
   * @param {string} title
   * @param {function(google.maps.Marker): void} [onClickCallback] - 點擊回調。
   * @param {string} [iconUrl]
   * @param {'bars' | 'search' | 'currentLocation' | string} [markerType='bars']
   * @param {Object} [placeData=null] - 相關地點資料，用於判斷是否為酒吧類並選擇圖示。
   * @param {Object} [markerOptions={}] - 其他 Google Maps Marker 選項。
   */
  const addMarker = (
    position,
    title,
    onClickCallback,
    iconUrl,
    markerType = "bars",
    placeData = null,
    markerOptions = {}
  ) => {
    if (!map.value) throw new Error("Map not initialized.");

    let finalIcon = iconUrl;
    if (!finalIcon && placeData && isBarLike(placeData)) {
      finalIcon = "/wine.png"; // 假設您的專案根目錄有 wine.png
    } else if (!finalIcon && markerType === "currentLocation") {
      finalIcon = "/now.png"; // 假設您的專案根目錄有 now.png
    }

    const marker = new window.google.maps.Marker({
      map: map.value,
      position: position,
      title: title,
      icon: finalIcon
        ? { url: finalIcon, scaledSize: new window.google.maps.Size(32, 32) }
        : undefined,
      ...markerOptions,
    });

    if (onClickCallback) {
      marker.addListener("click", () => onClickCallback(marker));
    }

    if (markerType === "bars") {
      markers.value.push(marker);
    } else if (markerType === "search") {
      searchMarkers.value.push(marker);
    } else if (markerType === "currentLocation") {
      currentMarker.value = marker; // 將當前位置標記儲存到 currentMarker
    }
    return marker;
  };

  /**
   * 在指定標記上顯示資訊視窗。
   */
  const showInfoWindow = (marker, content) => {
    if (!infoWindow.value || !map.value) return;
    infoWindow.value.setContent(content);
    infoWindow.value.open(map.value, marker);
  };

  /**
   * 關閉當前的資訊視窗。
   */
  const closeInfoWindow = () => {
    if (infoWindow.value) {
      infoWindow.value.close();
    }
  };

  /**
   * 格式化酒吧資訊視窗的 HTML 內容。
   * @param {Object} bar - 酒吧資料物件。
   * @returns {string} HTML 內容。
   */
  const formatBarInfoWindowContent = (bar) => {
    return `
      <div class="info-window-content">
        ${
          bar.imageUrl
            ? `<img src="${bar.imageUrl}" alt="${bar.name}" class="info-window-image">`
            : ""
        }
        <h3 class="info-window-title text-gray-800">${bar.name}</h3>
        <p class="info-window-meta text-gray-800">⭐️ ${bar.rating || "N/A"} (${
          bar.reviews || 0
        } 評論)</p>
        <p class="info-window-meta text-gray-800">💰 ${bar.priceRange || "N/A"}</p>
        <p class="info-window-meta text-gray-800">⏱️ ${
          bar.openingHours?.weekday_text?.[0] || "未提供營業時間"
        }</p>
        <p class="info-window-description text-gray-800">${
          bar.description || ""
        }</p>
        <div class="info-window-tags-container">
          ${
            bar.tags
              ?.map(
                (tag) =>
                  `<span class="info-window-tag text-gray-800">${tag}</span>`
              )
              .join("") || ""
          }
        </div>
      </div>
    `;
  };

  /**
   * 格式化地點搜尋結果的資訊視窗 HTML 內容。
   * @param {Object} place - 地點資料物件。
   * @returns {string} HTML 內容。
   */
  const formatPlaceInfoWindowContent = (place) => {
    return `
      <strong class="text-gray-800">${place.name}</strong><br/>
      <span class="text-gray-800">地址：${place.formatted_address || "N/A"}</span><br/>
      ${
        place.rating
          ? `<span class="text-gray-800">評分：${place.rating} (${
              place.user_ratings_total || 0
            } 評論)</span><br/>`
          : ""
      }
      ${
        place.international_phone_number
          ? `<span class="text-gray-800">電話：${place.international_phone_number}</span><br/>`
          : ""
      }
      ${
        place.website
          ? `<a href="${place.website}" target="_blank" class="text-blue-600">網站</a>`
          : ""
      }
    `;
  };

  /**
   * 平移地圖中心到指定位置。
   * @param {google.maps.LatLngLiteral | google.maps.LatLng} location - 目標位置。
   */
  const panTo = (location) => {
    if (map.value) {
      skipNextIdle = true; // 設置標記，表示是程式控制的移動
      map.value.panTo(location);
    }
  };

  /**
   * 設定地圖的縮放等級。
   * @param {number} zoomLevel - 縮放等級。
   */
  const setZoom = (zoomLevel) => {
    if (map.value) {
      skipNextIdle = true; // 設置標記
      map.value.setZoom(zoomLevel);
    }
  };

  /**
   * 調整地圖視圖以包含所有指定地理範圍。
   * @param {google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral} bounds - 地理範圍。
   */
  const fitBounds = (bounds) => {
    if (map.value) {
      skipNextIdle = true; // 設置標記
      map.value.fitBounds(bounds);
      // 限制 zoom 不要放太大
      window.google.maps.event.addListenerOnce(
        map.value,
        "bounds_changed",
        () => {
          if (!skipNextIdle) return; // 如果不是程式控制的移動，則不限制
          if (map.value.getZoom() > 15) {
            map.value.setZoom(15);
          }
          skipNextIdle = false; // 重置標記
        }
      );
    }
  };

  /**
   * 在地圖上顯示酒吧標記，並調整地圖視圖。
   * @param {Array<Object>} barsToMark - 要顯示的酒吧資料陣列。
   */
  const displayBarsOnMap = (barsToMark) => {
    if (!map.value) return;

    clearMarkers("bars"); // 只清除酒吧標記
    clearMarkers("search"); // 清除搜尋標記
    closeInfoWindow();
    clearMarkers("currentLocation"); // 清除當前位置標記

    const bounds = new window.google.maps.LatLngBounds();

    barsToMark.forEach((bar) => {
      const position = new window.google.maps.LatLng(
        bar.location.lat,
        bar.location.lng
      );
      const marker = addMarker(
        position,
        bar.name,
        (marker) => {
          showInfoWindow(marker, formatBarInfoWindowContent(bar));
        },
        null, // 讓 addMarker 根據 placeData 判斷圖示
        "bars",
        bar // 傳入 bar 資料供 isBarLike 判斷
      );
      bounds.extend(position);
    });

    if (barsToMark.length > 0 && map.value) {
      fitBounds(bounds);
    } else if (map.value) {
      map.value.setCenter(defaultCenter);
      map.value.setZoom(defaultZoom);
    }
  };

  /**
   * 請求瀏覽器地理定位權限。
   */
  const requestGeolocationPermission = () => {
    if (!navigator.geolocation) {
      console.warn("Browser does not support geolocation access");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => {
        console.log("User has allowed location permission");
      },
      (err) => {
        console.warn("User denied location permission, error code:", err.code);
      }
    );
  };

  /**
   * 取得使用者當前地理位置並在地圖上顯示。
   * @param {number} [mapContainerWidth=0] - 地圖容器寬度，用於偏移地圖中心。
   * @returns {Promise<google.maps.LatLngLiteral>} Promise resolves with current location.
   */
  const getCurrentLocation = (mapContainerWidth = 0) => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation || !map.value || !geocoder.value) {
        const errMsg =
          "Your browser does not support geolocation or map is not loaded.";
        error.value = errMsg;
        reject(new Error(errMsg));
        return;
      }

      loading.value = true;
      error.value = null;

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          clearMarkers("all"); // 清除所有標記
          closeInfoWindow();

          currentMarker.value = addMarker(
            location,
            "你的現在位置",
            (marker) => {
              geocoder.value.geocode(
                { location: marker.getPosition() },
                (results, status) => {
                  if (status === "OK" && results && results[0]) {
                    showInfoWindow(
                      marker,
                      `<strong>你的現在位置</strong><br/>${results[0].formatted_address}`
                    );
                  } else {
                    showInfoWindow(
                      marker,
                      `<strong>你的現在位置</strong><br/>（無法取得地址資訊）`
                    );
                  }
                }
              );
            },
            null, // 讓 addMarker 判斷圖示
            "currentLocation"
          );

          map.value.setCenter(location);
          map.value.setZoom(15);

          window.google.maps.event.addListenerOnce(map.value, "idle", () => {
            if (skipNextIdle) {
              // 如果是程式控制的移動，不執行偏移
              skipNextIdle = false; // 重置標記
              return;
            }
            const projection = map.value.getProjection();
            if (projection && mapContainerWidth > 0) {
              const scale = Math.pow(2, map.value.getZoom());
              const worldCoordinateCenter =
                projection.fromLatLngToPoint(location);
              // 假設資訊面板在左側，地圖中心需要向右偏移
              const pixelOffset = { x: mapContainerWidth / 2 / scale, y: 0 };
              const newCenter = new window.google.Point(
                worldCoordinateCenter.x + pixelOffset.x,
                worldCoordinateCenter.y // 不進行 Y 軸偏移
              );
              const shiftedLatLng = projection.fromPointToLatLng(newCenter);
              map.value.setCenter(shiftedLatLng);
            }

            if (currentMarker.value && infoWindow.value) {
              geocoder.value.geocode({ location }, (results, status) => {
                if (status === "OK" && results && results[0]) {
                  infoWindow.value.setContent(
                    `<strong>你現在的位置</strong><br/>${results[0].formatted_address}`
                  );
                } else {
                  infoWindow.value.setContent(
                    `<strong>你現在的位置</strong><br/>（無法取得地址資訊）`
                  );
                }
                infoWindow.value.open(map.value, currentMarker.value);
              });
            }
          });
          loading.value = false;
          resolve(location);
        },
        (err) => {
          loading.value = false;
          const errMsg = `無法取得你的位置。錯誤代碼：${err.code}`;
          error.value = errMsg;
          reject(err);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  /**
   * 取得 Google Places API 地點搜尋建議。
   * @param {string} input - 使用者輸入的搜尋字串。
   * @param {string} [region='tw'] - 限制搜尋的國家或地區代碼。
   * @param {google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral} [bounds] - 限制搜尋區域。
   * @returns {Promise<Array<google.maps.places.AutocompletePrediction>>} 搜尋建議陣列。
   */
  const getPlacePredictions = (input, region = "tw", bounds = null) => {
    return new Promise((resolve, reject) => {
      if (!autocompleteService.value) {
        reject(new Error("Autocomplete service not initialized."));
        return;
      }
      const request = {
        input: input,
        componentRestrictions: { country: region },
      };
      if (bounds) {
        request.bounds = bounds;
      } else if (map.value) {
        // 如果沒有指定 bounds，則使用當前地圖可視區域
        request.bounds = map.value.getBounds();
      }

      autocompleteService.value.getPlacePredictions(
        request,
        (predictions, status) => {
          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            predictions
          ) {
            resolve(predictions);
          } else {
            console.warn("搜尋建議失敗:", status);
            resolve([]);
          }
        }
      );
    });
  };

  /**
   * 使用 Google Places API 進行文字搜尋。
   * @param {string} query - 搜尋字串。
   * @param {google.maps.LatLngLiteral | google.maps.LatLng} [location] - 搜尋中心點。
   * @param {number} [radius=50000] - 搜尋半徑 (公尺)。
   * @param {string} [region='tw'] - 限制搜尋的國家或地區代碼。
   * @returns {Promise<Array<google.maps.places.PlaceResult>>} 搜尋結果陣列。
   */
  const textSearch = (
    query,
    location = null,
    radius = 50000,
    region = "tw"
  ) => {
    return new Promise((resolve, reject) => {
      if (!placesService.value || !map.value) {
        reject(new Error("Places service or map not initialized."));
        return;
      }
      loading.value = true;
      error.value = null;
      placesService.value.textSearch(
        {
          query: query,
          location: location || map.value.getCenter(),
          radius: radius,
          region: region,
        },
        (results, status) => {
          loading.value = false;
          if (
            status !== window.google.maps.places.PlacesServiceStatus.OK ||
            !results?.length
          ) {
            resolve([]);
            return;
          }
          resolve(results);
        }
      );
    });
  };

  /**
   * 使用 Google Places API 進行附近搜尋。
   * @param {string} query - 搜尋關鍵字。
   * @param {google.maps.LatLngLiteral | google.maps.LatLng} location - 搜尋中心點。
   * @param {number} [radius=2000] - 搜尋半徑 (公尺)。
   * @param {string[]} [types] - 要搜尋的地點類型。
   * @returns {Promise<Array<google.maps.places.PlaceResult>>} 附近搜尋結果陣列。
   */
  const nearbySearch = (query, location, radius = 2000, types = undefined) => {
    return new Promise((resolve, reject) => {
      if (!placesService.value || !map.value) {
        reject(new Error("Places service or map not initialized."));
        return;
      }
      loading.value = true;
      error.value = null;

      const request = {
        location: location,
        radius: radius,
        keyword: query,
        type: types, // 設置類型篩選
      };

      placesService.value.nearbySearch(request, (results, status) => {
        loading.value = false;
        if (
          status !== window.google.maps.places.PlacesServiceStatus.OK ||
          !results?.length
        ) {
          resolve([]);
          return;
        }
        resolve(results);
      });
    });
  };

  /**
   * 執行地點搜尋並在地圖上顯示結果。
   * @param {string} query - 搜尋字串。
   * @returns {Promise<Array<google.maps.places.PlaceResult>>} 搜尋到的地點陣列。
   */
  const searchAndDisplayPlaces = async (query) => {
    if (!map.value) {
      error.value = "地圖未初始化，無法搜尋地點。";
      return [];
    }
    loading.value = true;
    error.value = null;
    try {
      const results = await textSearch(query);

      if (!results.length) {
        clearMarkers("search");
        closeInfoWindow();
        return [];
      }

      clearMarkers("all"); // 清除所有標記
      closeInfoWindow();

      const bounds = new window.google.maps.LatLngBounds();
      let firstResultPlace = null; // 用於儲存第一個地點的資料

      results.forEach((place) => {
        if (!place.geometry || !place.geometry.location) return;

        const marker = addMarker(
          place.geometry.location,
          place.name || "",
          (marker) => {
            showInfoWindow(marker, formatPlaceInfoWindowContent(place));
          },
          null, // 讓 addMarker 判斷圖示
          "search",
          place // 傳入 place 資料
        );
        bounds.extend(place.geometry.location);
        if (!firstResultPlace) {
          firstResultPlace = place;
        }
      });

      if (map.value) {
        if (results.length === 1 && results[0].geometry?.location) {
          // 如果只有一個結果，平移並放大到該位置，然後顯示 InfoWindow
          panTo(results[0].geometry.location);
          setZoom(16);
          window.google.maps.event.addListenerOnce(map.value, "idle", () => {
            // 找到該標記並顯示資訊視窗
            const targetMarker = searchMarkers.value.find(
              (marker) =>
                marker.getPosition()?.lat() ===
                  results[0].geometry.location.lat() &&
                marker.getPosition()?.lng() ===
                  results[0].geometry.location.lng()
            );
            if (targetMarker && infoWindow.value) {
              showInfoWindow(
                targetMarker,
                formatPlaceInfoWindowContent(results[0])
              );
            }
          });
        } else {
          fitBounds(bounds);
        }
      }
      return results;
    } catch (err) {
      console.error("地點搜尋失敗:", err);
      error.value = "地點搜尋過程中發生錯誤。";
      return [];
    } finally {
      loading.value = false;
    }
  };

  /**
   * 將地圖平移到指定酒吧位置並顯示資訊視窗。
   * @param {Object} bar - 酒吧資料物件。
   */
  const panToAndShowBarInfo = (bar) => {
    if (!map.value) {
      error.value = "地圖未初始化，無法顯示酒吧資訊。";
      return;
    }
    clearMarkers("search");
    clearMarkers("currentLocation");
    closeInfoWindow();

    const position = new window.google.maps.LatLng(
      bar.location.lat,
      bar.location.lng
    );
    panTo(position);
    setZoom(15);

    window.google.maps.event.addListenerOnce(map.value, "idle", () => {
      const targetMarker = markers.value.find(
        (marker) =>
          marker.getPosition()?.lat() === bar.location.lat &&
          marker.getPosition()?.lng() === bar.location.lng
      );
      if (targetMarker) {
        showInfoWindow(targetMarker, formatBarInfoWindowContent(bar));
      } else {
        // 如果找不到現有標記 (例如在 nearbySearch 之外點擊列表項目)，則在該位置顯示一個臨時 InfoWindow
        infoWindow.value.setPosition(position);
        infoWindow.value.setContent(formatBarInfoWindowContent(bar));
        infoWindow.value.open(map.value);
      }
    });
  };

  // 組件卸載時清理資源
  onUnmounted(() => {
    clearMarkers("all"); // 清理所有標記
    // 釋放地圖實例和其他服務
    map.value = null;
    infoWindow.value = null;
    autocompleteService.value = null;
    placesService.value = null;
    geocoder.value = null;
  });

  // 暴露給外部組件使用的狀態和函數
  return {
    map,
    markers,
    searchMarkers,
    infoWindow,
    autocompleteService,
    placesService,
    geocoder,
    currentMarker,
    loading,
    error,
    loadGoogleMapsAPI,
    initMap,
    clearMarkers,
    addMarker,
    showInfoWindow,
    closeInfoWindow,
    panTo,
    setZoom,
    fitBounds,
    displayBarsOnMap,
    requestGeolocationPermission,
    getCurrentLocation,
    getPlacePredictions,
    textSearch,
    nearbySearch, // 新增暴露 nearbySearch
    searchAndDisplayPlaces,
    panToAndShowBarInfo,
    formatBarInfoWindowContent,
    formatPlaceInfoWindowContent,
  };
}
