// src/composable/useGoogleMaps/core.js
import { ref, shallowRef } from "vue";
import { TAIWAN_BOUNDS, DEFAULT_TAIPEI_LOCATION } from "../googleMapsConstants";

export function createGoogleMapsCore(mapContainerRef, options) {
  const { googleMapsApiKey, onLoading, onLoaded, onError, mapId, onMapIdle } =
    options;

  let map = null;
  let markers = [];
  let searchMarkers = [];
  let infoWindow = null;
  let loading = true;
  let isFetching = false;
  let isReady = ref(false);

  const barIconUrl = "/wine.png";
  const nowIconUrl = "/now.png";

  const loadGoogleMapsAPI = async () => {
    if (window.google && window.google.maps) {
      loading = false;
      onLoaded && onLoaded();
      return;
    }
    loading = true;
    onLoading && onLoading();
    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector(
        `script[src*="maps.googleapis.com/maps/api/js"]`
      );
      if (existingScript) {
        if (window.google && window.google.maps) {
          loading = false;
          onLoaded && onLoaded();
          resolve();
        } else {
          // 確保回調只設置一次
          if (!window.initMapCallback) {
            window.initMapCallback = () => {
              loading = false;
              onLoaded && onLoaded();
              resolve();
            };
            // 檢查 script src 是否已經包含 callback，避免重複添加
            if (!existingScript.src.includes("callback=initMapCallback")) {
              existingScript.src += "&callback=initMapCallback";
            }
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
          loading = false;
          onLoaded && onLoaded();
          resolve();
        };
      }
      script.onerror = (e) => {
        loading = false;
        const errorMessage = "Google Maps API 載入失敗";
        onError && onError(errorMessage);
        reject(new Error(errorMessage));
      };
      document.head.appendChild(script);
    });
  };

  const initMap = async () => {
    if (!(mapContainerRef.value instanceof HTMLElement)) {
      const errorMessage = "地圖容器未準備好或不是有效的 DOM 元素。";
      console.error(errorMessage, mapContainerRef.value);
      onError && onError(errorMessage);
      return;
    }
    if (!window.google || !window.google.maps) {
      // 若 google 尚未載入，主動 await 載入
      await loadGoogleMapsAPI();
    }
    if (!window.google || !window.google.maps) {
      const errorMessage = "Google Maps API 未載入。";
      console.error(errorMessage);
      onError && onError(errorMessage);
      return;
    }
    if (map) {
      console.log("地圖已初始化，跳過重複初始化。");
      return;
    }
    try {
      console.log('[DEBUG] 地圖容器 DOM:', mapContainerRef.value);
      console.log('[DEBUG] window.google:', window.google);
      console.log('[DEBUG] window.google.maps:', window.google && window.google.maps);
      map = new window.google.maps.Map(mapContainerRef.value, {
        center: DEFAULT_TAIPEI_LOCATION,
        zoom: 14,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        mapId: mapId || "YOUR_MAP_ID",
        restriction: {
          latLngBounds: TAIWAN_BOUNDS,
          strictBounds: false,
        },
        scrollwheel: true,
      });
      console.log('[DEBUG] 地圖物件:', map);

      // 在這裡才初始化 infoWindow
      infoWindow = new window.google.maps.InfoWindow({
        content: "",
        pixelOffset: new window.google.maps.Size(0, -30),
      });

      window.google.maps.event.addListener(map, "idle", () => {
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

  const requestGeolocationPermission = () => {
    if (!navigator.geolocation) {
      console.warn("瀏覽器不支援地理位置功能。");
      return;
    }
  };

  const getCurrentLocation = (offsetWidth = 0) => {
    isFetching = true;
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        isFetching = false;
        const msg = "瀏覽器不支援地理位置功能。";
        onError && onError(msg);
        reject(new Error(msg));
        return;
      }
      if (!map || !window.google.maps) {
        isFetching = false;
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

          clearMarkers("search");

          addMarker(
            {
              location: pos,
              title: "您的目前位置",
              isCurrentLocation: true,
              infoContent: "您現在在這裡！",
            },
            "search"
          );

          panTo(pos, 15, offsetWidth);
          isFetching = false;
          resolve(pos);
        },
        (error) => {
          isFetching = false;
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

  const addMarker = (options, type = "bars") => {
    if (!map || !window.google.maps) return null;

    const position = new window.google.maps.LatLng(
      options.location.lat,
      options.location.lng
    );
    const markerOptions = {
      position: position,
      map: map,
      title: options.title,
    };

    if (options.icon) {
      markerOptions.icon = options.icon;
    } else if (options.isCurrentLocation) {
      markerOptions.icon = {
        url: nowIconUrl,
        scaledSize: new window.google.maps.Size(40, 40),
        anchor: new window.google.maps.Point(20, 20),
      };
    } else if (options.isBarLike) {
      markerOptions.icon = {
        url: barIconUrl,
        scaledSize: new window.google.maps.Size(40, 40),
        anchor: new window.google.maps.Point(20, 40),
      };
    } else {
      markerOptions.icon = {
        url: "/MapMarker.png",
        scaledSize: new window.google.maps.Size(40, 40),
        anchor: new window.google.maps.Point(20, 40),
      };
    }

    const marker = new window.google.maps.Marker(markerOptions);

    if (options.infoContent || options.data) {
      // 確保 infoWindow 已經初始化才添加事件監聽器
      if (infoWindow) {
        marker.addListener("click", () => {
          const content = options.infoContent;
          showInfoWindow(marker, content);
        });
      } else {
        console.warn("InfoWindow 未初始化，無法為標記添加點擊事件。");
      }
    }

    if (type === "bars") {
      markers.push(marker);
    } else if (type === "search") {
      searchMarkers.push(marker);
    }
    return marker;
  };

  const clearMarkers = (type = "all") => {
    if (type === "bars" || type === "all") {
      markers.forEach((marker) => {
        if (marker) marker.setMap(null);
      });
      markers = [];
    }
    if (type === "search" || type === "all") {
      searchMarkers.forEach((marker) => {
        if (marker) marker.setMap(null);
      });
      searchMarkers = [];
    }
    // 在嘗試關閉之前，確保 infoWindow 已經存在且有 close 方法
    closeInfoWindow();
  };

  const showInfoWindow = (marker, content) => {
    if (infoWindow && map) {
      infoWindow.setContent(content);
      infoWindow.open(map, marker);
    } else {
      console.warn("無法顯示 InfoWindow：InfoWindow 或 Map 未初始化。");
    }
  };

  const closeInfoWindow = () => {
    // 增加更嚴謹的檢查，確保 infoWindow 及其 .close 方法存在
    if (infoWindow && typeof infoWindow.close === 'function') {
      infoWindow.close();
    } else {
      console.warn("無法關閉 InfoWindow：InfoWindow 未初始化或沒有 close 方法。");
    }
  };

  const panTo = (latLng, zoomLevel = null, offsetWidth = 0) => {
    if (!map || !window.google.maps) return;

    map.panTo(latLng);

    if (zoomLevel) {
      map.setZoom(zoomLevel);
    }

    if (offsetWidth > 0) {
      window.google.maps.event.addListenerOnce(map, "idle", () => {
        const offset = offsetWidth / 2;
        map.panBy(-offset, 0);
      });
    }
  };

  const setZoom = (level) => {
    if (map) {
      map.setZoom(level);
    }
  };

  const displayBarsOnMap = (bars, formatBarInfoWindowContent) => {
    if (!map || !window.google.maps) {
      console.warn("地圖或 Google 實例未準備好，無法顯示酒吧標記。");
      return;
    }

    clearMarkers("bars");

    if (!bars || bars.length === 0) {
      console.log("沒有酒吧數據可供顯示。");
      return;
    }

    const bounds = new window.google.maps.LatLngBounds();

    bars.forEach((bar) => {
      if (bar.location && bar.location.lat && bar.location.lng) {
        const marker = addMarker(
          {
            location: bar.location,
            title: bar.name,
            data: bar,
            isBarLike: bar.isBarLike === true,
            infoContent: formatBarInfoWindowContent(bar),
          },
          "bars"
        );
        if (marker && typeof marker.getPosition === 'function') {
          bounds.extend(marker.getPosition());
        }
      } else {
        console.warn(`酒吧 ${bar.name} 缺少有效的地理位置資訊。`);
      }
    });

    if (!bounds.isEmpty()) {
      if (bars.length === 1) {
        map.panTo(bounds.getCenter());
        map.setZoom(15);
      } else {
        map.fitBounds(bounds);
        // 這段邏輯可能會導致縮放過大，根據實際需求調整
        // if (map.getZoom() > 17) {
        //   map.setZoom(17);
        // }
      }
    }
  };

  function getMap() {
    return map;
  }

  function getPlacesService() {
    return window.google?.maps?.places && map ? new window.google.maps.places.PlacesService(map) : null;
  }

  function getAutocompleteService() {
    return window.google?.maps?.places ? new window.google.maps.places.AutocompleteService() : null;
  }

  function getGeocoderService() {
    return window.google?.maps ? new window.google.maps.Geocoder() : null;
  }

  function getDirectionsService() {
    return window.google?.maps ? new window.google.maps.DirectionsService() : null;
  }

  function getDirectionsRenderer() {
    return window.google?.maps ? new window.google.maps.DirectionsRenderer() : null;
  }

  function getGoogleMaps() {
    return window.google && window.google.maps ? window.google.maps : null;
  }

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
    clearMarkers("all");
    closeInfoWindow();

    try {
      // 直接用 Google Places API 搜尋所有地點
      const mainBars = await searchAndDisplayPlaces(searchQuery.value);

      if (mainBars && mainBars.length > 0) {
        // 不再做 bar 判斷，直接顯示所有結果
        mainBarForSearch.value = null;
        googleBars.value = mainBars.slice(0, 20);

        // 地圖定位到第一個結果
        if (googleMapsInstance() && googleBars.value.length > 0 && googleBars.value[0].location) {
          panTo(googleBars.value[0].location, 15);
        }
      } else {
        mainBarForSearch.value = null;
        googleBars.value = [];
        alert("查無結果。");
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

  return {
    map: getMap,
    markers,
    searchMarkers,
    infoWindow,
    google: getGoogleMaps,
    loading,
    isFetching,
    isReady,
    placesService: getPlacesService,
    autocompleteService: getAutocompleteService,
    geocoderService: getGeocoderService,
    directionsService: getDirectionsService,
    directionsRenderer: getDirectionsRenderer,
    loadGoogleMapsAPI,
    initMap,
    requestGeolocationPermission,
    getCurrentLocation,
    addMarker,
    clearMarkers,
    showInfoWindow,
    closeInfoWindow,
    panTo,
    setZoom,
    displayBarsOnMap,
    handleSearch,
  };
}