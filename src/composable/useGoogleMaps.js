import { ref, watch, onMounted, onUnmounted } from 'vue';

export function useGoogleMaps(mapContainerRef, options = {}) {
  const map = ref(null);
  const markers = ref([]); // 用於存放所有地圖上的標記
  const searchMarkers = ref([]); // 用於存放搜尋結果的標記 (與酒吧標記分開)
  const infoWindow = ref(null);
  const loading = ref(false); // 地圖 API 載入狀態
  const error = ref(null); // 地圖 API 載入錯誤訊息
  const currentMarker = ref(null); // 用於存放目前位置標記

  let placesService = null; // Google PlacesService
  let resizeObserver = null;

  const defaultOptions = {
    center: { lat: 25.0336, lng: 121.5654 }, // 預設台北市中心
    zoom: 13,
    googleMapsApiKey: '',
    onLoaded: () => {}, // API 載入成功後的回調
    onError: () => {}, // API 載入失敗後的回調
  };

  const mergedOptions = { ...defaultOptions, ...options };

  // 檢查 Google Maps API 是否已載入並初始化地圖
  const checkAndInitMap = async () => {
    loading.value = true;
    error.value = null;

    if (typeof window === 'undefined' || !window.google || !window.google.maps) {
      // API 腳本尚未載入，或者不在瀏覽器環境
      // 我們不負責載入腳本，所以這裡只警告並觸發 onError
      const msg = "Google Maps API 未載入。請確認已在外部載入並設定 callback。";
      console.warn(msg);
      error.value = msg;
      loading.value = false;
      mergedOptions.onError(msg);
      return;
    }

    try {
      if (!map.value && mapContainerRef.value) {
        map.value = new google.maps.Map(mapContainerRef.value, {
          center: mergedOptions.center,
          zoom: mergedOptions.zoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });
        placesService = new google.maps.places.PlacesService(map.value);
        console.log("Google Maps 地圖初始化成功。");
        mergedOptions.onLoaded(); // 觸發成功回調
      }
    } catch (e) {
      console.error("地圖初始化失敗:", e);
      const errMsg = `地圖初始化失敗: ${e.message || '未知錯誤'}`;
      error.value = errMsg;
      mergedOptions.onError(errMsg);
    } finally {
      loading.value = false;
    }
  };

  // 在組件掛載時，一旦 mapContainerRef 準備好，就檢查並嘗試初始化地圖
  onMounted(() => {
    watch(mapContainerRef, (newVal) => {
      if (newVal) {
        checkAndInitMap();
      }
    }, { immediate: true });

    // 監聽 window.google.maps 的可用性，以防 API 腳本是延遲載入的
    // 這是一個稍微 hacky 的方法，通常我們會依賴 callback
    // 但作為 fallback，可以在 API 載入完成後重新觸發 checkAndInitMap
    let checkInterval = setInterval(() => {
      if (window.google && window.google.maps && !map.value) {
        clearInterval(checkInterval);
        checkAndInitMap();
      }
    }, 500); // 每 500ms 檢查一次

    // 處理地圖容器大小變化
    if (mapContainerRef.value) {
      resizeObserver = new ResizeObserver(() => {
        if (map.value) {
          google.maps.event.trigger(map.value, 'resize');
        }
      });
      resizeObserver.observe(mapContainerRef.value);
    }
  });

  onUnmounted(() => {
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
    // 清理所有標記
    clearAllMarkers();
    if (infoWindow.value) {
      infoWindow.value.close();
      infoWindow.value = null;
    }
    map.value = null; // 釋放地圖實例
    placesService = null;
  });

  // 清除所有標記
  const clearAllMarkers = () => {
    markers.value.forEach(marker => marker.setMap(null));
    markers.value = [];
    searchMarkers.value.forEach(marker => marker.setMap(null));
    searchMarkers.value = [];
    if (currentMarker.value) {
      currentMarker.value.setMap(null);
      currentMarker.value = null;
    }
  };

  const clearMarkers = (type = 'all') => {
      if (type === 'search') {
          searchMarkers.value.forEach(marker => marker.setMap(null));
          searchMarkers.value = [];
      } else if (type === 'bars') {
          markers.value.forEach(marker => marker.setMap(null));
          markers.value = [];
      } else { // 'all'
          clearAllMarkers();
      }
  }


  // 在地圖上顯示酒吧
  const displayBarsOnMap = (bars) => {
    if (!map.value) {
      console.warn("地圖尚未初始化，無法顯示酒吧。");
      return;
    }

    clearMarkers('bars'); // 清除舊的酒吧標記

    const newMarkers = [];
    const bounds = new google.maps.LatLngBounds();

    bars.forEach((bar) => {
      const position = new google.maps.LatLng(bar.location.lat, bar.location.lng);
      const marker = new google.maps.Marker({
        position: position,
        map: map.value,
        title: bar.name,
        // icon: 'path/to/your/custom_icon.png', // 可以自定義圖標
      });

      marker.addListener("click", () => {
        showInfoWindow(marker, formatInfoWindowContent(bar), position);
      });

      newMarkers.push(marker);
      bounds.extend(position);
    });

    markers.value = newMarkers;

    if (newMarkers.length > 0) {
      // 如果只有一個點，直接移動到該點並設定較大的縮放
      if (newMarkers.length === 1 && !currentMarker.value) { // 如果只有一個酒吧且沒有用戶定位點
        map.value.setCenter(newMarkers[0].getPosition());
        map.value.setZoom(15); // 單點時較高的縮放
      } else if (newMarkers.length > 0) {
        // 如果有用戶定位點，則將其也考慮在內
        if (currentMarker.value) {
            bounds.extend(currentMarker.value.getPosition());
        }
        map.value.fitBounds(bounds);
        // 如果 fitBounds 後縮放級別過高，可以限制一下
        if (map.value.getZoom() > 16) { // 例如，不超過 16
            map.value.setZoom(16);
        }
      }
    }
  };

  const panTo = (lat, lng, panelWidth = 0) => {
    if (!map.value) return;

    const center = new google.maps.LatLng(lat, lng);
    let offset = 0;

    if (panelWidth > 0) {
      // 計算地圖中心偏移量，使標記在面板不遮擋的區域居中
      const mapDiv = mapContainerRef.value;
      const mapWidth = mapDiv.clientWidth;
      const offsetPx = panelWidth / 2; // 將面板寬度的一半作為偏移量

      // 如果面板在右側，則向左偏移，使其在左半邊地圖居中
      // 如果面板在左側，則向右偏移
      offset = offsetPx; // 假設面板在右側，需要向左偏移

      const projection = map.value.getProjection();
      if (projection) {
        const point = projection.fromLatLngToPoint(center);
        point.x -= offset / (2 ** map.value.getZoom()); // 偏移量會隨縮放級別變化
        const newCenter = projection.fromPointToLatLng(point);
        map.value.panTo(newCenter);
        return; // 使用 panTo 帶偏移，直接返回
      }
    }
    map.value.panTo(center); // 無偏移或無法計算偏移時使用
  };


  const setZoom = (zoomLevel) => {
    if (map.value) {
      map.value.setZoom(zoomLevel);
    }
  };

  const fitBounds = (bounds) => {
    if (map.value && bounds) {
      map.value.fitBounds(bounds);
    }
  };


  // 顯示 InfoWindow
  const showInfoWindow = (marker, content, position) => {
    if (!map.value || !google.maps) {
      console.warn("地圖或 Google Maps API 未準備好。");
      return;
    }
    if (!infoWindow.value) {
      infoWindow.value = new google.maps.InfoWindow();
    }
    infoWindow.value.setContent(content);
    infoWindow.value.open(map.value, marker || null); // 如果沒有 marker，則傳遞 null 並只用 position
    if (!marker && position) { // 如果沒有 marker 但有位置，直接設定位置
      infoWindow.value.setPosition(position);
    }
  };

  // 關閉 InfoWindow
  const closeInfoWindow = () => {
    if (infoWindow.value) {
      infoWindow.value.close();
    }
  };

  // 獲取地點預測 (自動完成)
  const getPlacePredictions = async (input) => {
    if (!placesService || !google.maps.places.AutocompleteService) {
      console.warn("PlacesService 或 AutocompleteService 未準備好。");
      return [];
    }
    const service = new google.maps.places.AutocompleteService();
    return new Promise((resolve) => {
      service.getPlacePredictions(
        { input: input, componentRestrictions: { country: 'tw' } }, // 限制台灣地區
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            resolve(predictions);
          } else {
            // console.error("地點預測失敗:", status);
            resolve([]); // 返回空陣列而不是錯誤，讓調用者處理
          }
        }
      );
    });
  };

  // 搜尋並顯示地點 (使用 Places API)
  const searchAndDisplayPlaces = (query) => {
    if (!map.value || !placesService) {
      console.warn("地圖或 PlacesService 未準備好，無法執行搜尋。");
      return;
    }

    clearMarkers('search'); // 清除舊的搜尋標記

    const request = {
      query: query,
      fields: ['name', 'geometry', 'place_id'],
    };

    placesService.findPlaceFromQuery(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
        const place = results[0]; // 只顯示第一個結果

        const marker = new google.maps.Marker({
          map: map.value,
          position: place.geometry.location,
          title: place.name,
          icon: { // 可以使用不同的圖標來區分搜尋結果
            url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
            scaledSize: new google.maps.Size(40, 40)
          }
        });

        searchMarkers.value.push(marker);
        map.value.setCenter(place.geometry.location);
        map.value.setZoom(16); // 搜尋結果放大顯示

        // 點擊搜尋標記顯示詳細資訊
        marker.addListener("click", () => {
          closeInfoWindow(); // 關閉所有現有 InfoWindow
          placesService.getDetails(
            { placeId: place.place_id },
            (details, detailsStatus) => {
              if (detailsStatus === google.maps.places.PlacesServiceStatus.OK && details) {
                showInfoWindow(marker, formatInfoWindowContent(details), place.geometry.location);
              } else {
                console.error("獲取地點詳細信息失敗:", detailsStatus);
                showInfoWindow(marker, `<h3>無法載入詳細資訊</h3><p>地點名稱: ${place.name}</p>`, place.geometry.location);
              }
            }
          );
        });

      } else {
        console.error("搜尋失敗:", status);
        alert(`搜尋「${query}」無結果。`);
      }
    });
  };


  // 獲取目前位置
  const getCurrentLocation = async (panelWidth = 0) => {
    if (!map.value || !google.maps) {
      throw new Error("地圖或 Google Maps API 未準備好。");
    }

    // 請求地理定位權限
    try {
      const position = await new Promise((resolve, reject) => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve(pos),
            (err) => reject(new Error(`地理定位錯誤: ${err.message}`)),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
        } else {
          reject(new Error("瀏覽器不支持地理定位。"));
        }
      });

      const userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      // 移除舊的目前位置標記
      if (currentMarker.value) {
        currentMarker.value.setMap(null);
      }

      // 添加新的目前位置標記
      currentMarker.value = new google.maps.Marker({
        position: userLocation,
        map: map.value,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#4285F4', // Google Blue
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: 'white',
        },
        title: '我的位置',
        zIndex: 9999, // 確保在其他標記上方
      });

      // 將地圖中心移動到目前位置，並考慮篩選面板的寬度
      panTo(userLocation.lat, userLocation.lng, panelWidth);
      setZoom(15); // 放大到一個合適的級別

      // 可以在這裡顯示一個 InfoWindow 提示用戶
      showInfoWindow(currentMarker.value, '您目前的位置', userLocation);

      return userLocation;

    } catch (error) {
      console.error("獲取目前位置失敗:", error);
      throw error; // 重新拋出錯誤，讓調用者處理
    }
  };

  // 計算兩點之間的距離 (公尺)
  const calculateDistance = (point1, point2) => {
    if (!google.maps || !google.maps.geometry) {
      console.warn("Google Maps Geometry 庫未載入，無法計算距離。");
      return 0; // 返回 0 或拋出錯誤
    }
    const latLng1 = new google.maps.LatLng(point1.lat, point1.lng);
    const latLng2 = new google.maps.LatLng(point2.lat, point2.lng);
    return google.maps.geometry.spherical.computeDistanceBetween(latLng1, latLng2);
  };

  // 格式化 InfoWindow 內容 (這個函數將在內部被調用，也可以暴露給外部覆寫)
  const formatInfoWindowContent = (data) => {
    // 檢查 data 是否為 null 或 undefined
    if (!data) {
      return `<div class="info-window-content"><h3>資訊不可用</h3><p>無法載入地點詳細資訊。</p></div>`;
    }

    // 判斷傳入的是否為 Google PlaceResult 類型 (檢查 place_id 屬性)
    const isPlaceResult = (obj) => {
      return obj && typeof obj === 'object' && obj.place_id !== undefined;
    };

    let name = '';
    let rating = 'N/A';
    let reviews = '0';
    let priceRange = '???';
    let openingHoursText = '未提供營業時間';
    let imageUrl = '';
    let description = '無描述';
    let tagsHtml = '';
    let distanceHtml = '';
    let address = '';
    let phone = '';
    let website = '';
    let url = ''; // Google Place URL

    if (isPlaceResult(data)) {
      name = data.name || '';
      rating = data.rating ? `⭐️ ${data.rating}` : 'N/A';
      reviews = data.user_ratings_total ? ` (${data.user_ratings_total} 評論)` : ' (0 評論)';
      priceRange = data.price_level !== undefined ? `NT$ ${data.price_level}` : '???'; // Google Maps price_level 是數字 0-4
      address = data.formatted_address || data.vicinity || '';
      phone = data.international_phone_number || '';
      website = data.website || '';
      url = data.url || ''; // Google Maps URL

      if (data.opening_hours && data.opening_hours.weekday_text && data.opening_hours.weekday_text.length > 0) {
        const currentDay = new Date().getDay(); // 0 (Sunday) to 6 (Saturday)
        openingHoursText = data.opening_hours.weekday_text[currentDay] || data.opening_hours.weekday_text[0] || '營業時間待提供';
      }
      if (data.photos && data.photos.length > 0) {
        imageUrl = data.photos[0].getUrl({ maxWidth: 300, maxHeight: 200 });
      }
      // 使用選鏈操作符安全訪問 editorial_summary
      description = data.editorial_summary?.overview || data.vicinity || data.formatted_address || '無描述';

      if (data.types && data.types.length > 0) {
        // 過濾掉不相關的類型，並格式化顯示
        const relevantTypes = data.types.filter(type =>
          !['point_of_interest', 'establishment', 'lodging', 'food'].includes(type)
        );
        tagsHtml = `<div class="info-window-tags-container">${relevantTypes
          .map((type) => `<span class="info-window-tag">${type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>`)
          .join("")}</div>`;
      }

    } else { // 假定是我們的 Bar 類型 (從模擬數據或其他來源)
      name = data.name || '';
      rating = data.rating ? `⭐️ ${data.rating}` : 'N/A';
      reviews = data.user_ratings_total ? ` (${data.user_ratings_total} 評論)` : ' (0 評論)';
      priceRange = data.priceRange || '???';
      address = data.address || '';
      phone = data.phone || '';
      website = data.website || '';
      url = data.url || '';

      if (data.openingHours && data.openingHours.weekday_text && data.openingHours.weekday_text.length > 0) {
        openingHoursText = data.openingHours.weekday_text[0];
      }
      imageUrl = data.imageUrl || '';
      description = data.description || '無描述';

      if (data.tags && data.tags.length > 0) {
        tagsHtml = `<div class="info-window-tags-container">${data.tags
          .map((tag) => `<span class="info-window-tag">${tag}</span>`)
          .join("")}</div>`;
      }
      if (data.distance !== undefined) {
        distanceHtml = `<p class="info-window-meta"><strong>距離:</strong> ${data.distance.toFixed(0)} 公尺</p>`;
      }
    }

    // 生成 HTML 內容
    return `
      <div class="info-window-content">
        <h3 class="info-window-title">${name}</h3>
        ${imageUrl ? `<img src="${imageUrl}" class="info-window-image" alt="${name}" />` : ''}
        <p class="info-window-meta"><strong>評價:</strong> ${rating}${reviews}</p>
        ${address ? `<p class="info-window-meta"><strong>地址:</strong> ${address}</p>` : ''}
        ${phone ? `<p class="info-window-meta"><strong>電話:</strong> <a href="tel:${phone}">${phone}</a></p>` : ''}
        ${website ? `<p class="info-window-meta"><strong>網站:</strong> <a href="${website}" target="_blank">${website}</a></p>` : ''}
        <p class="info-window-meta"><strong>營業時間:</strong> ${openingHoursText}</p>
        ${distanceHtml}
        <p class="info-window-meta"><strong>描述:</strong> ${description}</p>
        ${tagsHtml}
        ${url ? `<a href="${url}" target="_blank" class="info-window-more-info">查看 Google Maps</a>` : ''}
      </div>
    `;
  };


  return {
    map,
    markers,
    searchMarkers,
    infoWindow,
    loading,
    error,
    currentMarker,
    initMap: checkAndInitMap, // 重新命名為 initMap 以符合 MapView 的調用習慣
    displayBarsOnMap,
    clearMarkers,
    showInfoWindow,
    closeInfoWindow,
    panTo,
    setZoom,
    fitBounds,
    getPlacePredictions,
    searchAndDisplayPlaces,
    getCurrentLocation,
    calculateDistance,
    formatInfoWindowContent, // 暴露給外部可以訪問或覆寫
  };
}