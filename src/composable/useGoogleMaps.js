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
  const searchMarkers = ref([]);
  const infoWindow = shallowRef(null);
  const autocompleteService = shallowRef(null);
  const placesService = shallowRef(null);
  const geocoder = shallowRef(null);
  const currentMarker = shallowRef(null); // 用於顯示使用者目前位置的標記

  const loading = ref(false);
  const error = ref(null);

  // 輔助函數：判斷地點是否為酒吧類型
  const isBarLike = (place) => {
    // 檢查是否有包含「bar」或「酒吧」的類型，或者其名稱/標籤暗示是酒吧
    const nameLower = place.name ? place.name.toLowerCase() : "";
    const types = place.types || [];
    const tags = place.tags || []; // 假設你的 bar 數據有 tags

    const hasBarType = types.some(
      (type) =>
        type === "bar" ||
        type === "night_club" ||
        type === "liquor_store" ||
        type === "restaurant"
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
  const clearMarkers = (type = "all") => {
    if (type === "bars" || type === "all") {
      markers.value.forEach((marker) => marker.setMap(null));
      markers.value = [];
    }
    if (type === "search" || type === "all") {
      searchMarkers.value.forEach((marker) => marker.setMap(null));
      searchMarkers.value = [];
    }
  };

  const addMarker = (
    position,
    title,
    onClickCallback,
    iconUrl, // 這個參數現在變為可選，如果沒有提供，會根據 isBarLike 判斷
    markerType = "bars",
    placeData = null // 新增參數，用於傳遞原始地點數據
  ) => {
    if (!map.value) throw new Error("Map not initialized.");

    let finalIcon = iconUrl;
    // 如果沒有提供 iconUrl 且是酒吧類型，使用自定義圖標
    if (!finalIcon && placeData && isBarLike(placeData)) {
      finalIcon = "/wine.png"; // 假設您的酒杯圖標路徑是這個
    }

    const marker = new window.google.maps.Marker({
      map: map.value,
      position: position,
      title: title,
      icon: finalIcon
        ? { url: finalIcon, scaledSize: new window.google.maps.Size(32, 32) }
        : undefined, // 如果沒有 finalIcon，則使用 Google Maps 預設圖標
    });

    if (onClickCallback) {
      marker.addListener("click", () => onClickCallback(marker));
    }
    if (markerType === "bars") {
      markers.value.push(marker);
    } else if (markerType === "search") {
      searchMarkers.value.push(marker);
    }

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

  // 格式化酒吧資訊視窗內容
  const formatBarInfoWindowContent = (bar) => {
    const div = document.createElement("div");
    div.className = "info-window-content";
    div.innerHTML = `
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
            ?.map((tag) => `<span class="info-window-tag text-gray-800">${tag}</span>`)
            .join("") || ""
        }
      </div>
    `;
    return div;
  };

  // 格式化地點搜尋結果的資訊視窗內容
  const formatPlaceInfoWindowContent = (place) => {
    // 這裡的 place 是 Google Places API 返回的格式，不一定有 tags
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

  // 顯示酒吧在地圖上
  const displayBarsOnMap = (barsToMark) => {
    if (!map.value) return;

    clearMarkers("bars"); // 清除所有舊的酒吧標記
    closeInfoWindow(); // 關閉可能開啟的資訊視窗

    const bounds = new window.google.maps.LatLngBounds();
    barsToMark.forEach((bar) => {
      const position = new window.google.maps.LatLng(
        bar.location.lat,
        bar.location.lng
      );
      // 在這裡傳遞完整的 bar 對象給 addMarker，以便內部判斷是否使用自定義圖標
      const marker = addMarker(
        position,
        bar.name,
        // 點擊標記時的回調函式，直接使用內部的格式化函式
        (marker) => {
          showInfoWindow(marker, formatBarInfoWindowContent(bar));
        },
        null, // 不預設提供 iconUrl，讓 addMarker 內部判斷
        "bars", // 標記類型為酒吧
        bar // 傳遞完整的酒吧數據
      );
      bounds.extend(position);
    });

    if (barsToMark.length > 0 && map.value) {
      fitBounds(bounds); // 讓地圖適應所有標記
    } else if (map.value) {
      // 如果沒有酒吧，重置地圖視圖
      map.value.setCenter(defaultCenter);
      map.value.setZoom(defaultZoom);
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

          // 清除舊的搜尋標記和酒吧標記
          clearMarkers("all");
          closeInfoWindow();

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
              "/now.png" // 使用藍色點作為當前位置標記
              // 不傳遞 placeData，因為這不是一個酒吧數據
            );
          } else {
            currentMarker.value.setPosition(location);
            currentMarker.value.setMap(map.value); // 確保標記在地圖上
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

  // 搜尋地點並在地圖上顯示結果
  const searchAndDisplayPlaces = async (query) => {
    if (!map.value) {
      onError?.("地圖未初始化，無法搜尋地點。");
      return [];
    }

    loading.value = true;
    onLoading?.();
    try {
      const results = await textSearch(query);
      if (!results.length) {
        clearMarkers("search");
        closeInfoWindow();
        return [];
      }

      clearMarkers("bars");
      if (currentMarker.value) {
        currentMarker.value.setMap(null);
      }
      clearMarkers("search");
      closeInfoWindow();

      const bounds = new window.google.maps.LatLngBounds();
      let firstResultMarker = null;

      results.forEach((place) => {
        if (!place.geometry || !place.geometry.location) return;

        // 這裡也傳遞完整的 place 對象，讓 addMarker 內部判斷是否為酒吧類型並使用自定義圖標
        const marker = addMarker(
          place.geometry.location,
          place.name || "",
          (marker) => {
            showInfoWindow(marker, formatPlaceInfoWindowContent(place));
          },
          null, // 不預設提供 iconUrl
          "search", // 標記類型為搜尋結果
          place // 傳遞完整的地點數據
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
          // 等待地圖空閒後再顯示單一結果的資訊視窗
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
      onError?.("地點搜尋過程中發生錯誤。");
      return [];
    } finally {
      loading.value = false;
      onLoaded?.();
    }
  };

  // 平移地圖到指定酒吧並顯示其資訊視窗
  const panToAndShowBarInfo = (bar) => {
    if (!map.value) {
      onError?.("地圖未初始化，無法顯示酒吧資訊。");
      return;
    }

    clearMarkers("search");
    if (currentMarker.value) {
      currentMarker.value.setMap(null); // 隱藏目前位置標記
    }
    closeInfoWindow(); // 確保關閉舊的資訊視窗

    const position = new window.google.maps.LatLng(
      bar.location.lat,
      bar.location.lng
    );

    panTo(position); // 平移地圖到酒吧位置
    setZoom(15); // 設定合適的縮放級別

    window.google.maps.event.addListenerOnce(map.value, "idle", () => {
      const targetMarker = markers.value.find(
        (marker) =>
          marker.getPosition()?.lat() === bar.location.lat &&
          marker.getPosition()?.lng() === bar.location.lng
      );

      if (targetMarker) {
        showInfoWindow(targetMarker, formatBarInfoWindowContent(bar));
      } else {
        // 如果因為某些原因標記不在 markers 陣列中，則建立一個新的臨時資訊視窗
        infoWindow.value.setPosition(position);
        infoWindow.value.setContent(formatBarInfoWindowContent(bar));
        infoWindow.value.open(map.value);
      }
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
  };
}