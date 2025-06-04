import { ref, shallowRef, onUnmounted } from "vue";

// 全局變數，用於管理 Google Maps API 腳本載入狀態
let googleMapsLoading = false;
let googleMapsLoaded = false;
let googleMapsLoadPromise = null;

export function useGoogleMaps(mapContainerRef, options) {
  const {
    googleMapsApiKey,
    defaultCenter = { lat: 25.033, lng: 121.5654 },
    defaultZoom = 12,
    onLoading,
    onLoaded,
    onError,
  } = options;

  // 響應式狀態，用於儲存地圖相關實例和資訊
  const map = shallowRef(null);
  const markers = ref([]);
  const infoWindow = shallowRef(null);
  const autocompleteService = shallowRef(null);
  const placesService = shallowRef(null);
  const geocoder = shallowRef(null);
  const currentMarker = shallowRef(null);

  const loading = ref(false);
  const error = ref(null);

  // 1. 載入 Google Maps API 腳本
  const loadGoogleMapsAPI = () => {
    if (googleMapsLoaded && window.google && window.google.maps) {
      onLoaded?.();
      return Promise.resolve(window.google.maps);
    }

    if (googleMapsLoading && googleMapsLoadPromise) {
      return googleMapsLoadPromise;
    }

    googleMapsLoading = true;
    loading.value = true;
    onLoading?.();

    googleMapsLoadPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector(
        'script[src*="maps.googleapis.com"]'
      );
      if (existingScript) {
        if (window.google && window.google.maps) {
          googleMapsLoaded = true;
          googleMapsLoading = false;
          loading.value = false;
          onLoaded?.();
          resolve(window.google.maps);
          return;
        }
        existingScript.addEventListener("load", () => {
          googleMapsLoaded = true;
          googleMapsLoading = false;
          loading.value = false;
          onLoaded?.();
          resolve(window.google.maps);
        });
        existingScript.addEventListener("error", () => {
          const errMsg = "Google Maps API 腳本載入失敗 (現有腳本)。";
          error.value = errMsg;
          loading.value = false;
          googleMapsLoading = false;
          onError?.(errMsg);
          reject(new Error(errMsg));
        });
        return;
      }

      const script = document.createElement("script");
      if (!googleMapsApiKey) {
        const errMsg = "Google Maps API Key 未設定。";
        error.value = errMsg;
        loading.value = false;
        googleMapsLoading = false;
        onError?.(errMsg);
        reject(new Error(errMsg));
        return;
      }

      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places,geometry`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        googleMapsLoaded = true;
        googleMapsLoading = false;
        loading.value = false;
        onLoaded?.();
        resolve(window.google.maps);
      };

      script.onerror = () => {
        const errMsg = "Google Maps API 腳本載入失敗。";
        error.value = errMsg;
        loading.value = false;
        googleMapsLoading = false;
        onError?.(errMsg);
        reject(new Error(errMsg));
      };
      document.head.appendChild(script);
    });

    return googleMapsLoadPromise;
  };

  // 2. 初始化地圖和相關服務
  const initMap = () => {
    if (!mapContainerRef.value) {
      const errMsg = "地圖容器元素未找到！";
      error.value = errMsg;
      onError?.(errMsg);
      return;
    }
    if (!window.google || !window.google.maps) {
      const errMsg = "Google Maps API 未載入。";
      error.value = errMsg;
      onError?.(errMsg);
      return;
    }

    map.value = new window.google.maps.Map(mapContainerRef.value, {
      center: defaultCenter,
      zoom: defaultZoom,
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
    placesService.value = new window.google.maps.places.PlacesService(
      map.value
    );
    autocompleteService.value =
      new window.google.maps.places.AutocompleteService();
    geocoder.value = new window.google.maps.Geocoder();
  };

  // 3. 地圖標記操作
  const clearMarkers = () => {
    markers.value.forEach((marker) => marker.setMap(null));
    markers.value = [];
  };

  const addMarker = (position, title, onClickCallback, iconUrl) => {
    if (!map.value) throw new Error("Map not initialized.");

    const marker = new window.google.maps.Marker({
      map: map.value,
      position: position,
      title: title,
      icon: iconUrl
        ? { url: iconUrl, scaledSize: new window.google.maps.Size(32, 32) }
        : undefined,
    });

    if (onClickCallback) {
      marker.addListener("click", () => onClickCallback(marker));
    }
    markers.value.push(marker);
    return marker;
  };

  // 4. 資訊視窗操作
  const showInfoWindow = (marker, content) => {
    if (!infoWindow.value || !map.value) return;
    infoWindow.value.setContent(content);
    infoWindow.value.open(map.value, marker);
  };

  const closeInfoWindow = () => {
    if (infoWindow.value) {
      infoWindow.value.close();
    }
  };

  // 5. 地圖視圖控制
  const panTo = (location) => {
    if (map.value) {
      map.value.panTo(location);
    }
  };

  const setZoom = (zoomLevel) => {
    if (map.value) {
      map.value.setZoom(zoomLevel);
    }
  };

  const fitBounds = (bounds) => {
    if (map.value) {
      map.value.fitBounds(bounds);
    }
  };

  // 6. 地理定位功能
  const requestGeolocationPermission = () => {
    if (!navigator.geolocation) {
      console.warn("瀏覽器不支援地理位置存取");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => {
        console.log("使用者已允許位置權限");
      },
      (err) => {
        console.warn("使用者未允許位置權限，錯誤碼:", err.code);
      }
    );
  };

  const getCurrentLocation = (mapContainerWidth = 0) => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation || !map.value || !geocoder.value) {
        const errMsg = "你的瀏覽器不支援定位功能或地圖未載入。";
        error.value = errMsg;
        onError?.(errMsg);
        reject(new Error(errMsg));
        return;
      }

      loading.value = true;
      onLoading?.();

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          map.value.setCenter(location);
          map.value.setZoom(15);

          window.google.maps.event.addListenerOnce(map.value, "idle", () => {
            const projection = map.value.getProjection();
            if (projection && mapContainerWidth > 0) {
              const scale = Math.pow(2, map.value.getZoom());
              const worldCoordinateCenter =
                projection.fromLatLngToPoint(location);
              const pixelOffset = { x: mapContainerWidth / 2 / scale, y: 0 };
              const newCenter = new window.google.Point(
                worldCoordinateCenter.x + pixelOffset.x,
                worldCoordinateCenter.y + pixelOffset.y
              );
              const shiftedLatLng = projection.fromPointToLatLng(newCenter);
              map.value.setCenter(shiftedLatLng);
            }
          });

          if (!currentMarker.value) {
            currentMarker.value = addMarker(
              location,
              "你的位置",
              (marker) => {
                geocoder.value.geocode(
                  { location: marker.getPosition() },
                  (results, status) => {
                    if (status === "OK" && results && results[0]) {
                      showInfoWindow(
                        marker,
                        `<strong>你現在的位置</strong><br/>${results[0].formatted_address}`
                      );
                    } else {
                      showInfoWindow(
                        marker,
                        `<strong>你現在的位置</strong><br/>（無法取得地址資訊）`
                      );
                    }
                  }
                );
              },
              "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
            );
          } else {
            currentMarker.value.setPosition(location);
          }

          geocoder.value.geocode({ location }, (results, status) => {
            if (
              status === "OK" &&
              results &&
              results[0] &&
              infoWindow.value &&
              currentMarker.value
            ) {
              infoWindow.value.setContent(
                `<strong>你現在的位置</strong><br/>${results[0].formatted_address}`
              );
              infoWindow.value.open(map.value, currentMarker.value);
            } else {
              if (infoWindow.value && currentMarker.value) {
                infoWindow.value.setContent(
                  `<strong>你現在的位置</strong><br/>（無法取得地址資訊）`
                );
                infoWindow.value.open(map.value, currentMarker.value);
              }
            }
            loading.value = false;
            onLoaded?.();
            resolve(location);
          });
        },
        (err) => {
          loading.value = false;
          onLoaded?.();
          const errMsg = `無法取得你的位置。錯誤代碼：${err.code}`;
          error.value = errMsg;
          onError?.(errMsg);
          if (err.code === err.PERMISSION_DENIED) {
            alert("你未授權網頁存取位置，請重新設定成允許存取。");
          } else {
            alert(errMsg);
          }
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

  // 7. 地點搜尋功能
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

  const textSearch = (query, location, radius = 50000, region = "tw") => {
    return new Promise((resolve, reject) => {
      if (!placesService.value || !map.value) {
        reject(new Error("Places service or map not initialized."));
        return;
      }

      loading.value = true;
      onLoading?.();

      placesService.value.textSearch(
        {
          query: query,
          location: location || map.value.getCenter(),
          radius: radius,
          region: region,
        },
        (results, status) => {
          loading.value = false;
          onLoaded?.();

          if (
            status !== window.google.maps.places.PlacesServiceStatus.OK ||
            !results?.length
          ) {
            alert("找不到符合條件的地點");
            resolve([]);
            return;
          }
          resolve(results);
        }
      );
    });
  };

  // 8. 組件卸載時清理
  onUnmounted(() => {
    clearMarkers();
    if (currentMarker.value) {
      currentMarker.value.setMap(null);
    }
    map.value = null;
    infoWindow.value = null;
    autocompleteService.value = null;
    placesService.value = null;
    geocoder.value = null;
  });

  // 返回暴露給外部使用的狀態和方法
  return {
    map,
    markers,
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
    requestGeolocationPermission,
    getCurrentLocation,
    getPlacePredictions,
    textSearch,
  };
}
