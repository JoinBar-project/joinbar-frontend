// src/composable/useGoogleMaps/core.js
import { ref, shallowRef } from "vue";
import { TAIWAN_BOUNDS, DEFAULT_TAIPEI_LOCATION } from "../googleMapsConstants";

export function createGoogleMapsCore(mapContainerRef, options) {
  const { googleMapsApiKey, onLoading, onLoaded, onError, mapId, onMapIdle } =
    options;

  const map = shallowRef(null);
  const markers = ref([]);
  const searchMarkers = ref([]);
  const infoWindow = shallowRef(null);
  const loading = ref(true);
  const isFetching = ref(false);
  const isReady = ref(false);

  const barIconUrl = "/wine.png";
  const nowIconUrl = "/now.png";

  const loadGoogleMapsAPI = async () => {
    if (window.google && window.google.maps) {
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
          loading.value = false;
          onLoaded && onLoaded();
          resolve();
        } else {
          if (!window.initMapCallback) {
            window.initMapCallback = () => {
              loading.value = false;
              onLoaded && onLoaded();
              resolve();
            };
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

  const initMap = async () => {
    if (!(mapContainerRef.value instanceof HTMLElement)) {
      const errorMessage = "地圖容器未準備好或不是有效的 DOM 元素。";
      console.error(errorMessage, mapContainerRef.value);
      onError && onError(errorMessage);
      return;
    }
    if (!window.google || !window.google.maps) {
      await loadGoogleMapsAPI();
    }
    if (!window.google || !window.google.maps) {
      const errorMessage = "Google Maps API 未載入。";
      console.error(errorMessage);
      onError && onError(errorMessage);
      return;
    }
    if (map.value) {
      console.log("地圖已初始化，跳過重複初始化。");
      return;
    }
    try {
      console.log('[DEBUG] 地圖容器 DOM:', mapContainerRef.value);
      console.log('[DEBUG] window.google:', window.google);
      console.log('[DEBUG] window.google.maps:', window.google && window.google.maps);
      map.value = new window.google.maps.Map(mapContainerRef.value, {
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
      console.log('[DEBUG] 地圖物件:', map.value);

      infoWindow.value = new window.google.maps.InfoWindow({
        content: "",
        pixelOffset: new window.google.maps.Size(0, -30),
      });

      window.google.maps.event.addListener(map.value, "idle", () => {
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
    isFetching.value = true;
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        isFetching.value = false;
        const msg = "瀏覽器不支援地理位置功能。";
        onError && onError(msg);
        reject(new Error(msg));
        return;
      }
      if (!map.value || !window.google.maps) {
        isFetching.value = false;
        const msg = "地圖或 Google Maps API 未初始化。";
        onError && onError(msg);
        reject(new Error(msg));
        return;
      }

      clearMarkers("all");

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

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
          isFetching.value = false;
          resolve(pos);
        },
        (error) => {
          isFetching.value = false;
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
            default:
              msg = `獲取目前位置失敗: ${error.message}`;
          }
          onError && onError(msg);
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  const addMarker = (options, type = "bars") => {
    if (!map.value || !window.google.maps) return null;

    const position = new window.google.maps.LatLng(
      options.location.lat,
      options.location.lng
    );
    const markerOptions = {
      position: position,
      map: map.value,
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
      if (infoWindow.value) {
        marker.addListener("click", () => {
          const content = options.infoContent;
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

  const clearMarkers = (type = "all") => {
    closeInfoWindow();
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
  };

  const showInfoWindow = (marker, content) => {
    if (infoWindow.value && map.value) {
      infoWindow.value.setContent(content);
      infoWindow.value.open(map.value, marker);
    } else {
      console.warn("無法顯示 InfoWindow：InfoWindow 或 Map 未初始化。");
    }
  };

  const closeInfoWindow = () => {
    if (infoWindow.value && typeof infoWindow.value.close === 'function') {
      infoWindow.value.close();
    } else {
      console.warn("無法關閉 InfoWindow：InfoWindow 未初始化或沒有 close 方法。");
    }
  };

  const panTo = (latLng, zoomLevel = null, offsetWidth = 0) => {
    if (!map.value || !window.google.maps) return;

    map.value.panTo(latLng);

    if (zoomLevel) {
      map.value.setZoom(zoomLevel);
    }

    if (offsetWidth > 0) {
      window.google.maps.event.addListenerOnce(map.value, "idle", () => {
        const offset = offsetWidth / 2;
        map.value.panBy(-offset, 0);
      });
    }
  };

  const setZoom = (level) => {
    if (map.value) {
      map.value.setZoom(level);
    }
  };

  const displayBarsOnMap = async (bars, formatBarInfoWindowContent) => {
    if (!map.value || !window.google.maps) {
      console.warn("地圖或 Google 實例未準備好，無法顯示酒吧標記。");
      return;
    }

    clearMarkers("all");

    await new Promise(resolve => setTimeout(resolve, 50));

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
        map.value.panTo(bounds.getCenter());
        map.value.setZoom(15);
      } else {
        map.value.fitBounds(bounds);
      }
    }
  };

  function getMap() {
    return map.value;
  }

  function getInfoWindow() {
    return infoWindow.value;
  }

  function getMarkers() {
    return markers.value;
  }

  function getSearchMarkers() {
    return searchMarkers.value;
  }

  function getLoadingStatus() {
    return loading.value;
  }

  function getIsFetchingStatus() {
    return isFetching.value;
  }

  function getIsReadyStatus() {
    return isReady.value;
  }

  function getGoogleMaps() {
    return window.google && window.google.maps ? window.google.maps : null;
  }

  function getPlacesService() {
    return window.google?.maps?.places && map.value ? new window.google.maps.places.PlacesService(map.value) : null;
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

  return {
    map: getMap,
    infoWindow: getInfoWindow,
    markers: getMarkers,
    searchMarkers: getSearchMarkers,
    google: getGoogleMaps,
    loading: loading,
    isFetching: isFetching,
    isReady: isReady,
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
  };
}