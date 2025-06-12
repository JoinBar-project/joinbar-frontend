import { ref, shallowRef, onUnmounted } from "vue";

// 全域變數：用於管理 Google Maps API 腳本的載入狀態。
// 這些變數被設定為全域，以確保無論 useGoogleMaps 被呼叫多少次，
// Google Maps API 腳本只會被載入一次。
let googleMapsLoading = false; // 指示 API 腳本是否正在載入中
let googleMapsLoaded = false; // 指示 API 腳本是否已成功載入
let googleMapsLoadPromise = null; // 儲存 API 載入的 Promise，避免重複發起請求

/**
 * 封裝 Google Maps API 相關功能的 Composition API Hook。
 * 提供地圖初始化、標記管理、資訊視窗操作、地理定位、地點搜尋等功能。
 *
 * @param {Ref<HTMLElement>} mapContainerRef - 地圖容器元素的 Vue ref 物件。
 * @param {Object} options - 配置選項。
 * @param {string} options.googleMapsApiKey - Google Maps API Key，必要。
 * @param {Object} [options.defaultCenter={ lat: 25.033, lng: 121.5654 }] - 預設地圖中心座標 (經緯度)。
 * @param {number} [options.defaultZoom=12] - 預設地圖縮放等級。
 */
export function useGoogleMaps(mapContainerRef, options) {
  // 1. 參數解構與狀態初始化
  const {
    googleMapsApiKey,
    defaultCenter = { lat: 25.033, lng: 121.5654 }, // 預設為台北市中心
    defaultZoom = 12,
  } = options;

  // 使用 shallowRef 儲存 Google Maps 實例和相關服務，
  // 因為它們是大型物件，且其內部屬性通常不需要 Vue 的深度響應式追蹤。
  const map = shallowRef(null);
  const infoWindow = shallowRef(null);
  const autocompleteService = shallowRef(null); // 用於地點搜尋建議
  const placesService = shallowRef(null); // 用於地點搜尋詳情
  const geocoder = shallowRef(null); // 用於地理編碼 (座標轉地址或地址轉座標)
  const currentMarker = shallowRef(null); // 用於顯示使用者當前位置的標記

  // 使用 ref 儲存需要響應式追蹤的陣列或基本型別。
  const markers = ref([]); // 存放由後端提供的酒吧資訊生成的標記
  const searchMarkers = ref([]); // 存放由 Google Places API 搜尋結果生成的標記
  const loading = ref(false); // 指示地圖或某些操作是否正在載入
  const error = ref(null); // 存放操作中發生的錯誤訊息

  // 【改進點 1: 宣告 skipNextIdle 變數】
  // 用於在 panTo, setZoom, fitBounds 等操作後，避免重複觸發地圖的 'idle' 事件。
  // 當地圖程式性移動後，我們不希望立即執行某些依賴地圖靜止狀態的邏輯。
  let skipNextIdle = false;

  /**
   * 輔助函數：判斷一個地點物件是否為「酒吧」類型。
   * 判斷依據包括 Google Places API 的類型、地點名稱中的關鍵字以及自定義標籤。
   *
   * @param {Object} place - Google Place 物件或自定義酒吧物件。
   * @returns {boolean} - 如果是酒吧類型，則為 true。
   */
  const isBarLike = (place) => {
    const nameLower = place.name ? place.name.toLowerCase() : "";
    const types = place.types || [];
    const tags = place.tags || [];

    const hasBarType = types.some(
      (type) =>
        type === "bar" ||
        type === "night_club" ||
        type === "liquor_store" ||
        type === "restaurant" // 餐廳也可能包含酒吧性質，視需求可調整
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
   * 載入 Google Maps JavaScript API 腳本。
   * 採用單例模式，確保腳本只載入一次。
   *
   * @returns {Promise<Object>} - resolve 時回傳 window.google.maps 物件。
   */
  const loadGoogleMapsAPI = () => {
    // 如果 API 已經載入，直接回傳已解決的 Promise
    if (googleMapsLoaded && window.google && window.google.maps) {
      return Promise.resolve(window.google.maps);
    }
    // 如果 API 正在載入中，回傳現有的載入 Promise
    if (googleMapsLoading && googleMapsLoadPromise) {
      return googleMapsLoadPromise;
    }

    // 設定載入狀態
    googleMapsLoading = true;
    loading.value = true;
    error.value = null;

    googleMapsLoadPromise = new Promise((resolve, reject) => {
      // 檢查頁面中是否已存在 Google Maps 腳本標籤
      const existingScript = document.querySelector(
        'script[src*="maps.googleapis.com"]'
      );
      if (existingScript) {
        // 如果腳本已存在且已載入，直接 resolve
        if (window.google && window.google.maps) {
          googleMapsLoaded = true;
          googleMapsLoading = false;
          loading.value = false;
          resolve(window.google.maps);
          return;
        }
        // 如果腳本已存在但尚未載入，監聽其 load 和 error 事件
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

      // 檢查是否提供了 API Key
      if (!googleMapsApiKey) {
        const errMsg = "Google Maps API Key is not configured.";
        error.value = errMsg;
        loading.value = false;
        googleMapsLoading = false;
        reject(new Error(errMsg));
        return;
      }

      // 動態創建 script 標籤並將其添加到文檔的 <head> 中
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places,geometry`;
      script.async = true; // 非同步載入
      script.defer = true; // 延遲執行，直到 DOM 載入完成

      script.onload = () => {
        googleMapsLoaded = true;
        googleMapsLoading = false;
        loading.value = false;
        resolve(window.google.maps);
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
   * 初始化 Google Map 實例並設定基本屬性。
   * 必須在 API 腳本載入後才能呼叫。
   */
  const initMap = () => {
    if (!mapContainerRef.value) {
      const errMsg = "Map container element not found!";
      error.value = errMsg;
      return;
    }
    if (!window.google || !window.google.maps) {
      const errMsg = "Google Maps API not loaded.";
      error.value = errMsg;
      return;
    }

    map.value = new window.google.maps.Map(mapContainerRef.value, {
      center: defaultCenter, // 地圖中心點
      zoom: defaultZoom, // 縮放等級
      restriction: {
        // 限制地圖的可視區域在台灣大致的經緯度範圍內，確保地圖不會平移到其他國家。
        latLngBounds: {
          north: 25.5, // 台灣北部緯度
          south: 21.5, // 台灣南部緯度
          east: 122.2, // 台灣東部經度
          west: 119.3, // 台灣西部經度
        },
        strictBounds: false, // 允許地圖中心超出限制，但內容仍限制在邊界內
      },
      // 禁用一些預設的地圖控制項，讓地圖介面更簡潔。
      mapTypeControl: false,
      zoomControl: true, // 保持縮放控制項
      scaleControl: false,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: false,
      gestureHandling: "greedy", // 優化行動裝置上的手勢操作
    });

    // 初始化 Google Maps 相關服務
    infoWindow.value = new window.google.maps.InfoWindow();
    placesService.value = new window.google.maps.places.PlacesService(
      map.value
    );
    autocompleteService.value =
      new window.google.maps.places.AutocompleteService();
    geocoder.value = new window.google.maps.Geocoder();
  };

  /**
   * 清除地圖上的標記。
   *
   * @param {'all' | 'bars' | 'search'} [type='all'] - 要清除的標記類型。
   */
  const clearMarkers = (type = "all") => {
    if (type === "bars" || type === "all") {
      markers.value.forEach((marker) => marker.setMap(null)); // 從地圖移除標記
      markers.value = []; // 清空標記陣列
    }
    if (type === "search" || type === "all") {
      searchMarkers.value.forEach((marker) => marker.setMap(null));
      searchMarkers.value = [];
    }
  };

  /**
   * 在地圖上添加一個標記。
   *
   * @param {google.maps.LatLngLiteral | google.maps.LatLng} position - 標記的位置。
   * @param {string} title - 標記的標題 (hover 時顯示)。
   * @param {function(google.maps.Marker): void} [onClickCallback] - 標記點擊時的回調函數。
   * @param {string} [iconUrl] - 自定義標記圖示的 URL。
   * @param {'bars' | 'search' | 'currentLocation' | string} [markerType='bars'] - 標記的類型，用於內部管理。
   * @param {Object} [placeData=null] - 相關的地點資料，用於判斷是否套用酒吧圖示。
   * @param {Object} [markerOptions={}] - 【改進點 3: 支援自訂 Marker 選項】
   * 允許傳入額外的 Google Maps MarkerOptions，例如 zIndex, draggable 等。
   */
  const addMarker = (
    position,
    title,
    onClickCallback,
    iconUrl,
    markerType = "bars",
    placeData = null,
    markerOptions = {} // 新增的參數，用於傳遞 zIndex, draggable 等
  ) => {
    if (!map.value) throw new Error("Map not initialized.");

    let finalIcon = iconUrl;
    // 如果沒有自定義圖示，且是酒吧類型，則使用預設的酒吧圖示
    if (!finalIcon && placeData && isBarLike(placeData)) {
      finalIcon = "/wine.png";
    } else if (!finalIcon && markerType === "currentLocation") {
      finalIcon = "/now.png"; // 當前位置標記使用不同圖示
    }

    const marker = new window.google.maps.Marker({
      map: map.value,
      position: position,
      title: title,
      icon: finalIcon // 設定標記圖示及大小
        ? { url: finalIcon, scaledSize: new window.google.maps.Size(32, 32) }
        : undefined, // 如果沒有 finalIcon，則使用 Google Maps 預設圖標
      // 將外部傳入的 markerOptions 展開到 Marker 的建構選項中
      ...markerOptions,
    });

    if (onClickCallback) {
      marker.addListener("click", () => onClickCallback(marker)); // 綁定點擊事件
    }

    // 根據標記類型將其存入對應的陣列
    if (markerType === "bars") {
      markers.value.push(marker);
    } else if (markerType === "search") {
      searchMarkers.value.push(marker);
    }
    return marker;
  };

  /**
   * 在指定標記上顯示資訊視窗。
   *
   * @param {google.maps.Marker} marker - 要顯示資訊視窗的標記。
   * @param {string} content - 資訊視窗的 HTML 內容。
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
   * @param {Object} bar - 酒吧資訊物件。
   * @returns {string} HTML 字串。
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
        <p class="info-window-meta text-gray-800">⭐️ ${bar.rating} (${
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
   * @param {google.maps.places.PlaceResult} place - Google Places API 返回的地點物件。
   * @returns {string} HTML 字串。
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
   * 設定 skipNextIdle = true 避免在程式性移動後立即觸發不必要的 'idle' 事件處理。
   * @param {google.maps.LatLngLiteral | google.maps.LatLng} location - 目標位置。
   */
  const panTo = (location) => {
    if (map.value) {
      skipNextIdle = true;
      map.value.panTo(location);
    }
  };

  /**
   * 設定地圖的縮放等級。
   * 設定 skipNextIdle = true。
   * @param {number} zoomLevel - 目標縮放等級。
   */
  const setZoom = (zoomLevel) => {
    if (map.value) {
      skipNextIdle = true;
      map.value.setZoom(zoomLevel);
    }
  };

  /**
   * 調整地圖視圖以包含所有指定的地理範圍。
   * 設定 skipNextIdle = true。
   * @param {google.maps.LatLngBounds} bounds - 要包含的地理範圍。
   */
  const fitBounds = (bounds) => {
    if (map.value) {
      skipNextIdle = true;
      map.value.fitBounds(bounds);
    }
  };

  /**
   * 在地圖上顯示酒吧標記，並調整地圖視圖以包含所有酒吧。
   *
   * @param {Array<Object>} barsToMark - 要顯示的酒吧物件陣列。
   */
  const displayBarsOnMap = (barsToMark) => {
    if (!map.value) return;

    clearMarkers("bars"); // 清除舊的酒吧標記
    closeInfoWindow(); // 關閉資訊視窗
    if (currentMarker.value) {
      currentMarker.value.setMap(null); // 隱藏當前位置標記
    }
    clearMarkers("search"); // 清除任何搜尋結果標記

    const bounds = new window.google.maps.LatLngBounds(); // 用於計算所有標記的地理範圍

    barsToMark.forEach((bar) => {
      const position = new window.google.maps.LatLng(
        bar.location.lat,
        bar.location.lng
      );
      const marker = addMarker(
        position,
        bar.name,
        (marker) => {
          showInfoWindow(marker, formatBarInfoWindowContent(bar)); // 點擊標記顯示酒吧資訊
        },
        null, // 讓 addMarker 根據 isBarLike 判斷圖示
        "bars",
        bar // 傳遞完整的 bar 對象，用於 isBarLike 判斷
      );
      bounds.extend(position); // 擴展地理範圍以包含此標記
    });

    // 調整地圖視圖以包含所有酒吧標記
    if (barsToMark.length > 0 && map.value) {
      fitBounds(bounds);
    } else if (map.value) {
      // 如果沒有酒吧，回到預設中心和縮放
      map.value.setCenter(defaultCenter);
      map.value.setZoom(defaultZoom);
    }
  };

  /**
   * 請求瀏覽器的地理定位權限。
   * 這是一個簡單的權限請求，實際位置取得在 getCurrentLocation 中進行。
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
   * 取得使用者的當前地理位置並在地圖上顯示。
   *
   * @param {number} [mapContainerWidth=0] - 地圖容器的寬度，用於在取得位置後調整地圖中心，
   * 使其偏移以便資訊視窗不會被搜尋列等 UI 元素遮擋（尤其在行動裝置上）。
   * @returns {Promise<google.maps.LatLngLiteral>} - resolve 時回傳當前位置的經緯度。
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

          clearMarkers("all"); // 清除所有現有標記
          closeInfoWindow(); // 關閉資訊視窗

          // 更新或創建當前位置標記
          if (!currentMarker.value) {
            currentMarker.value = addMarker(
              location,
              "Your Location",
              (marker) => {
                // 點擊當前位置標記時，透過地理編碼服務取得詳細地址並顯示在資訊視窗中
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
              null,
              "currentLocation"
            );
          } else {
            currentMarker.value.setPosition(location);
            currentMarker.value.setMap(map.value); // 確保標記顯示在地圖上
          }

          // 平移地圖到當前位置並設定縮放
          map.value.setCenter(location);
          map.value.setZoom(15);

          // 監聽地圖 'idle' 事件，在地圖移動完成後再調整中心點和顯示資訊視窗。
          // 這樣可以確保資訊視窗在最終定位的地圖視圖上打開。
          window.google.maps.event.addListenerOnce(map.value, "idle", () => {
            const projection = map.value.getProjection();
            if (projection && mapContainerWidth > 0) {
              // 計算像素偏移量，用於將地圖中心向右移動，避免資訊視窗被左側 UI 遮擋。
              const scale = Math.pow(2, map.value.getZoom());
              const worldCoordinateCenter =
                projection.fromLatLngToPoint(location);
              const pixelOffset = { x: mapContainerWidth / 2 / scale, y: 0 };
              const newCenter = new window.google.Point(
                worldCoordinateCenter.x + pixelOffset.x,
                worldCoordinateCenter.y + worldCoordinateCenter.y
              );
              const shiftedLatLng = projection.fromPointToLatLng(newCenter);
              map.value.setCenter(shiftedLatLng); // 設定偏移後的新中心點
            }

            // 調整中心點後，再次確保資訊視窗打開並顯示當前位置資訊
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
          // 定位失敗處理
          loading.value = false;
          const errMsg = `無法取得你的位置。錯誤代碼：${err.code}`;
          error.value = errMsg;
          reject(err);
        },
        {
          enableHighAccuracy: true, // 啟用高精確度模式
          timeout: 10000, // 10 秒超時
          maximumAge: 0, // 不使用快取位置，強制取得最新位置
        }
      );
    });
  };

  /**
   * 取得 Google Places API 的地點搜尋建議。
   *
   * @param {string} input - 使用者輸入的搜尋字串。
   * @param {string} [region='tw'] - 限制搜尋結果的國家/地區代碼 (例如 'tw' 代表台灣)。
   * @returns {Promise<Array<google.maps.places.AutocompletePrediction>>} - resolve 時回傳地點建議陣列。
   */
  const getPlacePredictions = (input, region = "tw") => {
    return new Promise((resolve, reject) => {
      if (!autocompleteService.value) {
        reject(new Error("Autocomplete service not initialized."));
        return;
      }
      autocompleteService.value.getPlacePredictions(
        {
          input: input,
          componentRestrictions: { country: region }, // 限制搜尋國家為台灣
        },
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
   *
   * @param {string} query - 搜尋的文字查詢。
   * @param {google.maps.LatLngLiteral} [location] - 搜尋的中心點。如果未提供，則使用當前地圖中心。
   * @param {number} [radius=50000] - 搜尋半徑 (公尺)。
   * @param {string} [region='tw'] - 限制搜尋結果的國家/地區代碼。
   * @returns {Promise<Array<google.maps.places.PlaceResult>>} - resolve 時回傳地點搜尋結果陣列。
   */
  const textSearch = (query, location, radius = 50000, region = "tw") => {
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
          location: location || map.value.getCenter(), // 搜尋中心，如果未指定則為地圖中心
          radius: radius, // 搜尋半徑 (公尺)
          region: region,
        },
        (results, status) => {
          loading.value = false;
          if (
            status !== window.google.maps.places.PlacesServiceStatus.OK ||
            !results?.length
          ) {
            resolve([]); // 沒有結果或狀態不 OK 時，返回空陣列
            return;
          }
          resolve(results);
        }
      );
    });
  };

  /**
   * 執行地點搜尋並在地圖上顯示結果。
   *
   * @param {string} query - 要搜尋的查詢字串。
   * @returns {Promise<Array<google.maps.places.PlaceResult>>} - resolve 時回傳搜尋結果陣列。
   */
  const searchAndDisplayPlaces = async (query) => {
    if (!map.value) {
      error.value = "地圖未初始化，無法搜尋地點。";
      return [];
    }
    loading.value = true;
    error.value = null;
    try {
      const results = await textSearch(query); // 執行文字搜尋

      if (!results.length) {
        clearMarkers("search");
        closeInfoWindow();
        return [];
      }

      clearMarkers("all"); // 清除所有現有標記 (酒吧、搜尋、當前位置)
      if (currentMarker.value) {
        currentMarker.value.setMap(null); // 隱藏當前位置標記
      }
      closeInfoWindow();

      const bounds = new window.google.maps.LatLngBounds(); // 用於調整地圖視圖以包含所有結果
      let firstResultMarker = null; // 儲存第一個結果的標記，以便單一結果時自動打開資訊視窗

      results.forEach((place) => {
        if (!place.geometry || !place.geometry.location) return;

        // 為每個搜尋結果添加標記。
        // 這裡傳遞完整的 place 對象，讓 addMarker 內部判斷是否為酒吧類型並使用自定義圖標。
        const marker = addMarker(
          place.geometry.location,
          place.name || "",
          (marker) => {
            showInfoWindow(marker, formatPlaceInfoWindowContent(place)); // 點擊標記顯示地點資訊
          },
          null, // 不預設提供 iconUrl，讓 addMarker 內部根據 placeData 判斷
          "search", // 標記類型為搜尋結果
          place // 傳遞完整的地點數據
        );
        bounds.extend(place.geometry.location); // 擴展地理範圍以包含此標記
        if (!firstResultMarker) {
          firstResultMarker = marker; // 紀錄第一個標記
        }
      });

      if (map.value) {
        // 如果只有一個結果，則將地圖平移並縮放到該地點，並自動打開資訊視窗
        if (results.length === 1 && results[0].geometry?.location) {
          panTo(results[0].geometry.location);
          setZoom(16); // 放大一點以顯示單一地點細節
          // 等待地圖移動完成後再打開資訊視窗
          window.google.maps.event.addListenerOnce(map.value, "idle", () => {
            if (firstResultMarker && infoWindow.value) {
              showInfoWindow(
                firstResultMarker,
                formatPlaceInfoWindowContent(results[0])
              );
            }
          });
        } else {
          // 如果有多個結果，調整地圖視圖以包含所有結果
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
   * 將地圖平移到指定的酒吧位置，並顯示其資訊視窗。
   *
   * @param {Object} bar - 要顯示的酒吧物件。
   */
  const panToAndShowBarInfo = (bar) => {
    if (!map.value) {
      error.value = "地圖未初始化，無法顯示酒吧資訊。";
      return;
    }
    clearMarkers("search"); // 清除搜尋標記，確保只顯示酒吧資訊
    if (currentMarker.value) {
      currentMarker.value.setMap(null); // 隱藏當前位置標記
    }
    closeInfoWindow(); // 確保關閉舊的資訊視窗

    const position = new window.google.maps.LatLng(
      bar.location.lat,
      bar.location.lng
    );
    panTo(position); // 平移到酒吧位置
    setZoom(15); // 設定縮放等級

    // 監聽地圖 'idle' 事件，當地圖移動完成後顯示資訊視窗。
    window.google.maps.event.addListenerOnce(map.value, "idle", () => {
      // 嘗試在現有的酒吧標記中找到目標酒吧的標記
      const targetMarker = markers.value.find(
        (marker) =>
          marker.getPosition()?.lat() === bar.location.lat &&
          marker.getPosition()?.lng() === bar.location.lng
      );
      if (targetMarker) {
        showInfoWindow(targetMarker, formatBarInfoWindowContent(bar));
      } else {
        // 如果沒有找到對應的標記 (例如是外部傳入的單一酒吧資訊)，則直接在位置打開資訊視窗
        infoWindow.value.setPosition(position);
        infoWindow.value.setContent(formatBarInfoWindowContent(bar));
        infoWindow.value.open(map.value);
      }
    });
  };

  // 【改進點 2: onUnmounted 的清理函式優化】
  // 在 Vue 組件卸載時執行清理工作。
  // 這裡只清理組件內部的地圖資源，而不會重置全域的 googleMapsLoaded 和 googleMapsLoading 狀態。
  // 這樣做是為了確保 Google Maps API 腳本本身一旦載入，就不會因為組件的掛載/卸載而重複載入。
  onUnmounted(() => {
    clearMarkers(); // 清除所有由這個 Hook 創建的標記
    if (currentMarker.value) {
      currentMarker.value.setMap(null); // 移除當前位置標記
    }
    // 將所有 shallowRef 儲存的 Google Maps 實例設為 null，釋放記憶體。
    map.value = null;
    infoWindow.value = null;
    autocompleteService.value = null;
    placesService.value = null;
    geocoder.value = null;
    // 不再重置全域的 googleMapsLoaded 和 googleMapsLoading，
    // 因為它們指示的是 API 腳本是否被載入，而非地圖實例是否存在。
    // googleMapsLoaded = false;
    // googleMapsLoading = false;
    // googleMapsLoadPromise = null; // 這個也可以保留，因為它指向已 resolve 的 Promise
  });

  // 返回所有需要暴露給外部組件使用的響應式狀態和函數。
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
    searchAndDisplayPlaces,
    panToAndShowBarInfo,
    formatBarInfoWindowContent,
    formatPlaceInfoWindowContent,
  };
}
