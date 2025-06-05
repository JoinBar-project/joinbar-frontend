// src/composables/useGoogleMaps.js
import { ref, shallowRef, onUnmounted } from 'vue';

// 使用全局變數來確保 Google Maps 腳本只載入一次
let googleMapsLoadPromise = null;
let googleMapsLoaded = false;
let googleMapsLoadingStatus = ref(false); // 全局 loading 狀態，可觀察

export function useGoogleMaps(mapContainerRef, options = {}) {
  // Composable 內部響應式狀態
  const map = shallowRef(null); // 使用 shallowRef 避免不必要的深度響應
  const markers = ref([]); // 所有自訂標記
  const searchMarkers = ref([]); // 搜尋結果標記 (專用)
  const infoWindow = shallowRef(null); // 資訊視窗
  const currentMarker = shallowRef(null); // 目前被點擊的標記
  const geocoder = shallowRef(null); // Geocoder 服務
  const placesService = shallowRef(null); // Places Service
  const autocompleteService = shallowRef(null); // Autocomplete Service
  const loading = ref(false); // Composable 實例的 loading 狀態
  const error = ref(null);

  // 從 options 獲取 API Key 和回調函數
  const googleMapsApiKey = options.googleMapsApiKey || import.meta.env.VITE_Maps_API_KEY;
  const onLoading = options.onLoading || (() => {});
  const onLoaded = options.onLoaded || (() => {});
  const onError = options.onError || (() => {});

  // --- 腳本載入邏輯 (確保只載入一次) ---
  const loadGoogleMapsAPI = async () => {
    if (googleMapsLoaded && window.google && window.google.maps) {
      return Promise.resolve(window.google);
    }

    if (googleMapsLoadingStatus.value && googleMapsLoadPromise) {
      return googleMapsLoadPromise;
    }

    googleMapsLoadingStatus.value = true;
    loading.value = true;
    onLoading(); // 調用外部 onLoading 回調

    googleMapsLoadPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        if (window.google && window.google.maps) {
          googleMapsLoaded = true;
          googleMapsLoadingStatus.value = false;
          loading.value = false;
          onLoaded();
          resolve(window.google);
          return;
        }

        // 如果腳本已存在但尚未載入完成，則監聽其載入事件
        existingScript.addEventListener('load', () => {
          googleMapsLoaded = true;
          googleMapsLoadingStatus.value = false;
          loading.value = false;
          onLoaded();
          resolve(window.google);
        });
        existingScript.addEventListener('error', () => {
          const msg = 'Google Maps API 載入失敗 (既存腳本)';
          error.value = msg;
          googleMapsLoadingStatus.value = false;
          loading.value = false;
          onError(msg);
          reject(new Error(msg));
        });
        return;
      }

      const script = document.createElement('script');
      if (!googleMapsApiKey) {
        const msg = 'Google Maps API Key 未設定';
        error.value = msg;
        loading.value = false;
        googleMapsLoadingStatus.value = false;
        onError(msg);
        reject(new Error(msg));
        return;
      }

      // 注意：這裡使用 options 傳入的 API Key，或者從 .env 讀取
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places,geometry`; // 添加 geometry 庫用於距離計算
      script.async = true;
      script.defer = true;

      script.onload = () => {
        googleMapsLoaded = true;
        googleMapsLoadingStatus.value = false;
        loading.value = false;
        onLoaded(); // 調用外部 onLoaded 回調
        resolve(window.google);
      };

      script.onerror = () => {
        const msg = 'Google Maps API 載入失敗';
        error.value = msg;
        loading.value = false;
        googleMapsLoadingStatus.value = false;
        onError(msg); // 調用外部 onError 回調
        reject(new Error(msg));
      };
      document.head.appendChild(script);
    });

    return googleMapsLoadPromise;
  };

  // --- 地圖核心功能 ---

  const initMap = async (element = mapContainerRef.value, options = {}) => {
    if (!element) {
      const msg = '地圖容器元素未找到.';
      error.value = msg;
      onError(msg);
      throw new Error(msg);
    }
    try {
      error.value = null; // 清除之前的錯誤
      await loadGoogleMapsAPI();

      const defaultOptions = {
        center: { lat: 25.0330, lng: 121.5654 }, // 台北車站附近
        zoom: 13,
        mapTypeControl: false, // <-- 將這裡從 true 改為 false
        streetViewControl: true,
        fullscreenControl: true,
      };

      map.value = new window.google.maps.Map(element, {
        ...defaultOptions,
        ...options,
      });

      // 初始化 Places Service 和 Geocoder
      placesService.value = new window.google.maps.places.PlacesService(map.value);
      autocompleteService.value = new window.google.maps.places.AutocompleteService();
      geocoder.value = new window.google.maps.Geocoder();

      // 初始化 InfoWindow
      infoWindow.value = new window.google.maps.InfoWindow();

      return map.value;
    } catch (err) {
      console.error('地圖初始化失敗:', err);
      error.value = err.message;
      onError(err.message);
      throw err;
    }
  };

  // --- 標記管理 ---

  const addMarker = (position, type = 'bar', options = {}) => {
    if (!map.value) return null;

    const marker = new window.google.maps.Marker({
      position,
      map: map.value,
      ...options,
    });

    if (type === 'bar') {
      markers.value.push(marker); // 儲存一般酒吧標記
    } else if (type === 'search') {
      searchMarkers.value.push(marker); // 儲存搜尋結果標記
    }

    return marker;
  };

  const clearMarkers = (type = 'all') => {
    if (type === 'bar' || type === 'all') {
      markers.value.forEach((marker) => marker.setMap(null));
      markers.value = [];
    }
    if (type === 'search' || type === 'all') {
      searchMarkers.value.forEach((marker) => marker.setMap(null));
      searchMarkers.value = [];
    }
  };

  // --- InfoWindow 相關 ---

  const showInfoWindow = (marker, content) => {
    if (infoWindow.value && map.value) {
      infoWindow.value.setContent(content);
      infoWindow.value.open(map.value, marker);
      currentMarker.value = marker; // 記錄目前開啟的標記
    }
  };

  const closeInfoWindow = () => {
    if (infoWindow.value) {
      infoWindow.value.close();
      currentMarker.value = null;
    }
  };

  // --- 地圖視圖控制 ---

  const panTo = (latLng) => {
    if (map.value) {
      map.value.panTo(latLng);
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

  // --- 地區地點服務 ---

  const getPlacePredictions = async (input) => {
    if (!autocompleteService.value) {
      console.warn('AutocompleteService 未初始化.');
      return [];
    }
    try {
      const { predictions } = await autocompleteService.value.getPlacePredictions({ input });
      return predictions;
    } catch (e) {
      console.error('獲取地點預測失敗:', e);
      return [];
    }
  };

  const searchAndDisplayPlaces = async (query) => {
    if (!placesService.value || !map.value) {
      console.warn('PlacesService 或 Map 未初始化.');
      return;
    }
    loading.value = true;
    clearMarkers('search'); // 清除之前的搜尋結果標記
    closeInfoWindow(); // 關閉資訊視窗

    try {
      placesService.value.textSearch(
        { query: query, bounds: map.value.getBounds() }, // 在目前地圖範圍內搜尋
        (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            const bounds = new window.google.maps.LatLngBounds();
            results.forEach((place) => {
              if (place.geometry && place.geometry.location) {
                const marker = addMarker(place.geometry.location, 'search', {
                  title: place.name,
                  icon: {
                    url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" // 搜尋結果使用藍色標記
                  }
                });
                if (marker) {
                  // 為搜尋結果標記添加資訊視窗
                  let content = `<div><strong>${place.name}</strong></div>`;
                  if (place.formatted_address) {
                    content += `<div>${place.formatted_address}</div>`;
                  }
                  if (place.rating) {
                    content += `<div>評分: ${place.rating} (${place.user_ratings_total} 則評論)</div>`;
                  }
                  marker.addListener('click', () => {
                    showInfoWindow(marker, content);
                  });
                }
                bounds.extend(place.geometry.location);
              }
            });
            if (!bounds.isEmpty()) {
                map.value.fitBounds(bounds);
            }
          } else {
            console.warn('Place search was not successful for the following reason: ' + status);
            error.value = '搜尋失敗：' + status;
          }
          loading.value = false;
        }
      );
    } catch (e) {
      console.error('執行地點搜尋失敗:', e);
      error.value = '執行地點搜尋失敗';
      loading.value = false;
    }
  };

  // --- 地理定位 ---

  const requestGeolocationPermission = () => {
    if (navigator.geolocation) {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve(position),
          (err) => reject(err)
        );
      });
    } else {
      console.warn('瀏覽器不支持地理定位。');
      return Promise.reject(new Error('Geolocation not supported by this browser.'));
    }
  };

  const getCurrentLocation = async (sidebarWidth = 0) => {
    if (!map.value || !geocoder.value) {
      const msg = '地圖或 Geocoder 未初始化.';
      error.value = msg;
      onError(msg);
      return;
    }
    loading.value = true;
    try {
      const position = await requestGeolocationPermission();
      const latLng = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      // 清除所有標記，包括酒吧和搜尋結果
      clearMarkers('all');

      // 添加目前位置標記
      const currentLocationMarker = addMarker(latLng, 'currentLocation', {
        title: '我的位置',
        icon: {
          url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png" // 目前位置使用綠色標記
        }
      });

      // 逆地理編碼獲取地址
      geocoder.value.geocode({ location: latLng }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const address = results[0].formatted_address;
          showInfoWindow(currentLocationMarker, `<div><strong>我的目前位置</strong></div><div>${address}</div>`);
        } else {
          showInfoWindow(currentLocationMarker, `<div><strong>我的目前位置</strong></div><div>無法獲取地址</div>`);
          console.error('Geocoder failed due to: ' + status);
        }
      });

      // 調整地圖中心和視野
      map.value.setCenter(latLng);
      map.value.setZoom(16); // 更近的視野

      // 如果有側邊欄，調整中心點以考慮側邊欄的偏移
      if (sidebarWidth > 0) {
        const mapDiv = map.value.getDiv();
        const mapWidth = mapDiv.offsetWidth;
        const newCenterPx = new window.google.maps.Point(mapWidth / 2 - sidebarWidth / 2, mapDiv.offsetHeight / 2);
        const newCenterLatLng = map.value.getProjection().fromContainerPixelToLatLng(newCenterPx);
        map.value.panTo(newCenterLatLng);
      }

    } catch (err) {
      const msg = '獲取目前位置失敗: ' + err.message;
      console.error(msg, err);
      error.value = msg;
      onError(msg);
    } finally {
      loading.value = false;
    }
  };

  // --- 顯示酒吧數據 ---

  const displayBarsOnMap = (bars) => {
    if (!map.value) return;

    clearMarkers('bar'); // 清除舊的酒吧標記

    if (!infoWindow.value) {
        infoWindow.value = new window.google.maps.InfoWindow(); // 確保 infoWindow 已初始化
    }

    bars.forEach(bar => {
      if (bar.location && bar.location.lat && bar.location.lng) {
        const marker = addMarker({ lat: bar.location.lat, lng: bar.location.lng }, 'bar', {
          title: bar.name
        });

        if (marker) {
          const content = `
            <div class="info-window-content">
              <h3 class="info-window-title">${bar.name}</h3>
              ${bar.imageUrl ? `<img src="${bar.imageUrl}" alt="${bar.name}" class="info-window-image">` : ''}
              <p class="info-window-meta">評分: ${bar.rating || 'N/A'} ⭐ (${bar.reviews || 0} 評論)</p>
              <p class="info-window-meta">價格範圍: ${bar.priceRange || 'N/A'}</p>
              <p class="info-window-meta">營業時間: ${bar.openingHours?.weekday_text?.[0] || 'N/A'}</p>
              <p class="info-window-description">${bar.description || ''}</p>
              <div class="info-window-tags-container">
                ${bar.tags && bar.tags.map(tag => `<span class="info-window-tag">${tag}</span>`).join('')}
              </div>
            </div>
          `;

          marker.addListener('click', () => {
            showInfoWindow(marker, content);
          });
        }
      }
    });
  };

  // --- 組件卸載時清理 ---
  onUnmounted(() => {
    clearMarkers('all');
    map.value = null;
    infoWindow.value = null;
    currentMarker.value = null;
    geocoder.value = null;
    placesService.value = null;
    autocompleteService.value = null;
  });


  return {
    // 響應式狀態
    loading,
    error,
    map,
    markers,
    searchMarkers, // 暴露搜尋標記
    infoWindow,
    currentMarker, // 暴露目前標記

    // 函數
    loadGoogleMapsAPI,
    initMap,
    addMarker,
    clearMarkers,
    showInfoWindow,
    closeInfoWindow,
    panTo,
    setZoom,
    fitBounds,
    getPlacePredictions,
    searchAndDisplayPlaces,
    requestGeolocationPermission,
    getCurrentLocation,
    displayBarsOnMap,
  };
}