import { ref, shallowRef, onUnmounted } from "vue";

let googleMapsLoading = false;
let googleMapsLoaded = false;
let googleMapsLoadPromise = null;

/**
 * Google Maps 相關功能的 Composition API Hook。
 */
export function useGoogleMaps(mapContainerRef, options) {
  const {
    googleMapsApiKey,
    defaultCenter = { lat: 25.033, lng: 121.5654 },
    defaultZoom = 12,
    mapId,
  } = options;

  const map = shallowRef(null);
  const infoWindow = shallowRef(null);
  // const autocompleteService = shallowRef(null); // 已棄用
  // const placesService = shallowRef(null); // 已棄用
  const geocoder = shallowRef(null);
  const currentMarker = shallowRef(null);

  const markers = ref([]);
  const searchMarkers = ref([]);
  const loading = ref(false);
  const error = ref(null);

  let skipNextIdle = false;

  // ... isBarLike 函數保持不變

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

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places,geometry&v=beta${mapId ? "&map_ids=" + mapId : ""}`;
      script.async = true;
      script.defer = true;

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
   * 初始化 Google Map 實例與相關服務。
   */
  const initMap = () => {
    if (!mapContainerRef.value || !window.google || !window.google.maps) {
      error.value = "地圖容器或 API 未載入。";
      return;
    }

    map.value = new window.google.maps.Map(mapContainerRef.value, {
      center: defaultCenter,
      zoom: defaultZoom,
      mapId: mapId,
      restriction: {
        latLngBounds: {
          north: 25.5,
          south: 21.5,
          east: 122.2,
          west: 119.3,
        },
        strictBounds: false,
      },
      mapTypeControl: false,
      zoomControl: true,
      scaleControl: false,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: false,
      gestureHandling: "greedy",
    });

    infoWindow.value = new window.google.maps.InfoWindow();
    // placesService.value = new window.google.maps.places.PlacesService(map.value); // 已棄用
    // autocompleteService.value = new window.google.maps.places.AutocompleteService(); // 已棄用
    geocoder.value = new window.google.maps.Geocoder();
  };

  // 其餘標記、資訊視窗、地圖控制等函數保持不變

  /**
   * 取得 Google Places API 地點搜尋建議。（已棄用）
   */
  /*
  const getPlacePredictions = (input, region = "tw") => {
    return new Promise((resolve, reject) => {
      if (!autocompleteService.value) {
        reject(new Error("Autocomplete service not initialized."));
        return;
      }
      autocompleteService.value.getPlacePredictions(
        {
          input: input,
          componentRestrictions: { country: region },
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
  */

  /**
   * 使用 Google Places API 進行文字搜尋。（已棄用）
   */
  /*
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
  */

  /**
   * 執行地點搜尋並在地圖上顯示結果。（已棄用）
   */
  /*
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

      clearMarkers("all");
      if (currentMarker.value) {
        currentMarker.value.setMap(null);
      }
      closeInfoWindow();

      const bounds = new window.google.maps.LatLngBounds();
      let firstResultMarker = null;

      results.forEach((place) => {
        if (!place.geometry || !place.geometry.location) return;

        const marker = addMarker(
          place.geometry.location,
          place.name || "",
          (marker) => {
            showInfoWindow(marker, formatPlaceInfoWindowContent(place));
          },
          null,
          "search",
          place
        );
        bounds.extend(place.geometry.location);
        if (!firstResultMarker) {
          firstResultMarker = marker;
        }
      });

      if (map.value) {
        if (results.length === 1 && results[0].geometry?.location) {
          panTo(results[0].geometry.location);
          setZoom(16);
          window.google.maps.event.addListenerOnce(map.value, "idle", () => {
            if (firstResultMarker && infoWindow.value) {
              showInfoWindow(
                firstResultMarker,
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
  */

  // 組件卸載時清理資源
  onUnmounted(() => {
    clearMarkers();
    if (currentMarker.value) {
      currentMarker.value.setMap(null);
    }
    map.value = null;
    infoWindow.value = null;
    // autocompleteService.value = null; // 已棄用
    // placesService.value = null; // 已棄用
    geocoder.value = null;
  });

  // 暴露給外部組件使用的狀態和函數
  return {
    map,
    markers,
    searchMarkers,
    infoWindow,
    // autocompleteService, // 已棄用
    // placesService, // 已棄用
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
    // getPlacePredictions, // 已棄用
    // textSearch, // 已棄用
    // searchAndDisplayPlaces, // 已棄用
    panToAndShowBarInfo,
    formatBarInfoWindowContent,
    formatPlaceInfoWindowContent,
  };
}