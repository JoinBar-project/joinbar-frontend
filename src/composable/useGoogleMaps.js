import { ref, shallowRef, onUnmounted } from "vue";

let googleMapsLoading = false;
let googleMapsLoaded = false;
let googleMapsLoadPromise = null;

export function useGoogleMaps(mapContainerRef, options) {
  const {
    googleMapsApiKey,
    defaultCenter = { lat: 25.033, lng: 121.5654 }, // 台北市中心
    defaultZoom = 12,
    onLoading,
    onLoaded,
    onError,
    onMapIdle,
  } = options;

  const map = shallowRef(null);
  const markers = ref([]); // 用於酒吧標記
  const searchMarkers = ref([]); // 用於搜尋結果標記
  const infoWindow = shallowRef(null);
  const autocompleteService = shallowRef(null);
  const placesService = shallowRef(null);
  const geocoder = shallowRef(null);
  const currentMarker = shallowRef(null);

  const loading = ref(false);
  const error = ref(null);
  const isFetching = ref(false);

  // 用於控制地圖 panTo 或 setZoom 後的下一個 idle 事件不觸發資料請求
  let skipNextIdle = false;

  const isBarLike = (place) => {
    const nameLower = place.name ? place.name.toLowerCase() : "";
    const types = place.types || [];
    const tags = "tags" in place && Array.isArray(place.tags) ? place.tags : [];

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

  // 新增：將 Google Place Types 映射到中文標籤的函數
  const mapGooglePlaceTypesToChinese = (types) => {
    const typeMap = {
      "accounting": "會計",
      "airport": "機場",
      "amusement_park": "遊樂園",
      "aquarium": "水族館",
      "art_gallery": "美術館",
      "atm": "自動櫃員機",
      "bakery": "麵包店",
      "bank": "銀行",
      "bar": "酒吧",
      "beauty_salon": "美容院",
      "bicycle_store": "自行車店",
      "book_store": "書店",
      "bowling_alley": "保齡球館",
      "bus_station": "公車站",
      "cafe": "咖啡館",
      "campground": "露營地",
      "car_dealer": "汽車經銷商",
      "car_rental": "汽車租賃",
      "car_repair": "汽車維修",
      "car_wash": "洗車場",
      "casino": "賭場",
      "cemetery": "墓地",
      "church": "教堂",
      "city_hall": "市政廳",
      "clothing_store": "服裝店",
      "convenience_store": "便利商店",
      "courthouse": "法院",
      "dentist": "牙醫",
      "department_store": "百貨公司",
      "doctor": "醫生",
      "drugstore": "藥妝店",
      "electrician": "電工",
      "electronics_store": "電子產品店",
      "embassy": "大使館",
      "fire_station": "消防局",
      "florist": "花店",
      "funeral_home": "殯儀館",
      "furniture_store": "家具店",
      "gas_station": "加油站",
      "gym": "健身房",
      "hair_care": "美髮",
      "hardware_store": "五金行",
      "health_care": "醫療保健",
      "hindu_temple": "印度教寺廟",
      "home_goods_store": "家居用品店",
      "hospital": "醫院",
      "insurance_agency": "保險公司",
      "jewelry_store": "珠寶店",
      "laundry": "洗衣店",
      "lawyer": "律師",
      "library": "圖書館",
      "light_rail_station": "輕軌站",
      "liquor_store": "酒類專賣店",
      "local_government_office": "地方政府機關",
      "locksmith": "鎖匠",
      "lodging": "住宿",
      "meal_delivery": "外送服務",
      "meal_takeaway": "外帶服務",
      "mosque": "清真寺",
      "movie_rental": "電影租賃",
      "movie_theater": "電影院",
      "moving_company": "搬家公司",
      "museum": "博物館",
      "night_club": "夜店",
      "painter": "油漆工",
      "park": "公園",
      "parking": "停車場",
      "pet_store": "寵物店",
      "pharmacy": "藥局",
      "physiotherapist": "物理治療師",
      "plumber": "水電工",
      "police": "警察局",
      "post_office": "郵局",
      "primary_school": "小學",
      "real_estate_agency": "房地產經紀公司",
      "restaurant": "餐廳",
      "roofing_contractor": "屋頂承包商",
      "rv_park": "房車公園",
      "school": "學校",
      "secondary_school": "中學",
      "shoe_store": "鞋店",
      "shopping_mall": "購物中心",
      "spa": "水療",
      "stadium": "體育場",
      "storage": "倉儲",
      "store": "商店",
      "subway_station": "地鐵站",
      "supermarket": "超市",
      "synagogue": "猶太教堂",
      "taxi_stand": "計程車招呼站",
      "train_station": "火車站",
      "transit_station": "公共交通站",
      "travel_agency": "旅行社",
      "university": "大學",
      "veterinary_care": "獸醫",
      "zoo": "動物園",
      // 通用類型
      "point_of_interest": "景點",
      "establishment": "場所",
      "food": "美食",
      "health": "健康",
      "finance": "金融",
      "government": "政府",
      "education": "教育",
      "lodging": "住宿",
      "place_of_worship": "宗教場所",
      // 其他可能的類型
      "tourist_attraction": "旅遊景點",
      "atm": "提款機",
      "convenience_store": "便利店",
      "bakery": "烘焙坊",
      "book_store": "書店",
      "cafe": "咖啡廳",
      "food": "餐飲",
      "restaurant": "餐廳",
      "shopping_mall": "購物中心",
      "spa": "水療中心",
      "gym": "健身房",
      "park": "公園",
      "museum": "博物館",
      "library": "圖書館",
      "hospital": "醫院",
      "pharmacy": "藥局",
      "police": "警察局",
      "fire_station": "消防局",
      "post_office": "郵局",
      "bank": "銀行",
      "lodging": "酒店",
      "movie_theater": "電影院",
      "zoo": "動物園",
      "art_gallery": "藝術畫廊",
      "church": "教堂",
      "synagogue": "猶太教堂",
      "mosque": "清真寺",
      "hindu_temple": "印度廟",
      "stadium": "體育館",
      "airport": "機場",
      "train_station": "火車站",
      "bus_station": "巴士站",
      "subway_station": "地鐵站",
      "taxi_stand": "計程車排班區",
      "travel_agency": "旅行社",
      "car_rental": "汽車租賃",
      "car_repair": "汽車維修",
      "car_wash": "洗車",
      "gas_station": "加油站",
      "parking": "停車場",
      "electrician": "電工",
      "plumber": "水管工",
      "locksmith": "鎖匠",
      "painter": "油漆工",
      "roofing_contractor": "屋頂承包商",
      "real_estate_agency": "房地產中介",
      "insurance_agency": "保險公司",
      "lawyer": "律師",
      "accountant": "會計師",
      "dentist": "牙醫",
      "doctor": "醫生",
      "physiotherapist": "物理治療師",
      "veterinary_care": "獸醫",
      "beauty_salon": "美容院",
      "hair_care": "美髮",
      "laundry": "洗衣店",
      "drugstore": "藥店",
      "department_store": "百貨店",
      "clothing_store": "服裝店",
      "shoe_store": "鞋店",
      "jewelry_store": "珠寶店",
      "electronics_store": "電子產品店",
      "hardware_store": "五金店",
      "home_goods_store": "家居用品店",
      "furniture_store": "家具店",
      "pet_store": "寵物店",
      "book_store": "書店",
      "florist": "花店",
      "store": "商店",
      "school": "學校",
      "university": "大學",
      "primary_school": "小學",
      "secondary_school": "中學",
      "courthouse": "法院",
      "city_hall": "市政廳",
      "local_government_office": "地方政府機關",
      "embassy": "大使館",
      "cemetery": "墓地",
      "funeral_home": "殯儀館",
      "casino": "賭場",
      "night_club": "夜總會",
      "bowling_alley": "保齡球館",
      "amusement_park": "遊樂園",
      "aquarium": "水族館",
      "zoo": "動物園",
      "campground": "露營地",
      "rv_park": "露營車公園",
      "stadium": "體育場",
      "light_rail_station": "輕軌站",
      "storage": "儲物",
      "moving_company": "搬家公司",
      "meal_delivery": "餐飲外送",
      "meal_takeaway": "餐飲外帶",
    };

    return types
      .map((type) => typeMap[type] || null) // 嘗試映射，如果沒有則返回 null
      .filter((type) => type !== null) // 過濾掉未映射的類型
      .filter((value, index, self) => self.indexOf(value) === index); // 去重
  };


  const loadGoogleMapsAPI = () => {
    if (googleMapsLoaded && window.google && window.google.maps) {
      if (onLoaded) onLoaded();
      return Promise.resolve(window.google.maps);
    }
    if (googleMapsLoading && googleMapsLoadPromise) {
      return googleMapsLoadPromise;
    }

    googleMapsLoading = true;
    loading.value = true;
    error.value = null;
    if (onLoading) onLoading();

    googleMapsLoadPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector(
        'script[src*="maps.googleapis.com"]'
      );
      if (existingScript) {
        if (window.google && window.google.maps) {
          googleMapsLoaded = true;
          googleMapsLoading = false;
          loading.value = false;
          if (onLoaded) onLoaded();
          resolve(window.google.maps);
          return;
        }
        existingScript.addEventListener("load", () => {
          googleMapsLoaded = true;
          googleMapsLoading = false;
          loading.value = false;
          if (onLoaded) onLoaded();
          resolve(window.google.maps);
        });
        existingScript.addEventListener("error", () => {
          const errMsg =
            "Google Maps API script failed to load (existing script).";
          error.value = errMsg;
          loading.value = false;
          googleMapsLoading = false;
          if (onError) onError(errMsg);
          reject(new Error(errMsg));
        });
        return;
      }

      const script = document.createElement("script");
      if (!googleMapsApiKey) {
        const errMsg = "Google Maps API Key is not configured.";
        error.value = errMsg;
        loading.value = false;
        googleMapsLoading = false;
        if (onError) onError(errMsg);
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
        if (onLoaded) onLoaded();
        resolve(window.google.maps);
      };
      script.onerror = () => {
        const errMsg = "Google Maps API script failed to load.";
        error.value = errMsg;
        loading.value = false;
        googleMapsLoading = false;
        if (onError) onError(errMsg);
        reject(new Error(errMsg));
      };
      document.head.appendChild(script);
    });
    return googleMapsLoadPromise;
  };

  const initMap = () => {
    if (!mapContainerRef.value) {
      const errMsg = "Map container element not found!";
      error.value = errMsg;
      if (onError) onError(errMsg);
      return;
    }
    if (!window.google || !window.google.maps) {
      const errMsg = "Google Maps API not loaded.";
      error.value = errMsg;
      if (onError) onError(errMsg);
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

    map.value.addListener("idle", onMapIdleHandler);
  };

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
    iconUrl,
    markerType = "bars",
    placeData = null
  ) => {
    if (!map.value || !window.google || !window.google.maps) {
      throw new Error("Map not initialized or Google Maps API not loaded.");
    }

    let finalIcon = iconUrl;
    if (!finalIcon && placeData && isBarLike(placeData)) {
      finalIcon = "/wine.png";
    } else if (!finalIcon && markerType === "currentLocation") {
      finalIcon = "/now.png";
    }

    const marker = new window.google.maps.Marker({
      map: map.value,
      position: position,
      title: title,
      icon: finalIcon
        ? {
            url: finalIcon,
            scaledSize: new window.google.maps.Size(32, 32),
          }
        : undefined,
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
      <p class="info-window-meta text-gray-800">⭐️ ${bar.rating || "N/A"} (${
      bar.user_ratings_total || 0
    } 評論)</p>
      <p class="info-window-meta text-gray-800">⏱️ ${
        bar.opening_hours?.weekday_text?.[0] || "未提供營業時間"
      }</p>
      <p class="info-window-description text-gray-800">${
        bar.description || ""
      }</p>
      <div class="info-window-tags-container">
        ${
          bar.tags
            ?.map(
              (tag) => `<span class="info-window-tag text-gray-800">${tag}</span>`
            )
            .join("") || ""
        }
      </div>
    `;
    return div;
  };

  const formatPlaceInfoWindowContent = (place) => {
    const div = document.createElement("div");
    div.className = "info-window-content";
    div.innerHTML = `
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
    return div;
  };

  const panTo = (location) => {
    if (map.value) {
      skipNextIdle = true;
      map.value.panTo(location);
    }
  };

  const setZoom = (zoomLevel) => {
    if (map.value) {
      skipNextIdle = true;
      map.value.setZoom(zoomLevel);
    }
  };

  const fitBounds = (bounds) => {
    if (map.value) {
      skipNextIdle = true;
      map.value.fitBounds(bounds);
    }
  };

  const displayBarsOnMap = (barsToMark, onBarMarkerClick) => {
    if (!map.value || !window.google || !window.google.maps) return;

    clearMarkers("bars");

    barsToMark.forEach((bar) => {
      const position = new window.google.maps.LatLng(
        bar.location.lat,
        bar.location.lng
      );
      addMarker(
        position,
        bar.name,
        (marker) => {
          showInfoWindow(marker, formatBarInfoWindowContent(bar));
          if (onBarMarkerClick) {
            onBarMarkerClick(bar);
          }
        },
        null,
        "bars",
        bar
      );
    });
  };

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
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 60000,
      }
    );
  };

  const getCurrentLocation = (mapContainerWidth = 0) => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation || !map.value || !geocoder.value) {
        const errMsg =
          "您的瀏覽器不支援地理定位或地圖尚未載入。";
        error.value = errMsg;
        if (onError) onError(errMsg);
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
              "/now.png",
              "currentLocation"
            );
          } else {
            currentMarker.value.setPosition(location);
            currentMarker.value.setMap(map.value);
          }

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
            });
          });

          loading.value = false;
          resolve(location);
        },
        (err) => {
          loading.value = false;
          const errMsg = `無法取得您的位置。錯誤代碼：${err.code}`;
          error.value = errMsg;
          if (onError) onError(errMsg);
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

  const getPlacePredictions = (input, region = "tw") => {
    return new Promise((resolve, reject) => {
      if (!autocompleteService.value || !window.google || !window.google.maps) {
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
      if (!placesService.value || !map.value || !window.google || !window.google.maps) {
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

  const searchAndDisplayPlaces = async (query) => {
    if (!map.value) {
      error.value = "地圖未初始化，無法搜尋地點。";
      if (onError) onError(error.value);
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
        currentMarker.value = null;
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
      if (onError) onError(error.value);
      return [];
    } finally {
      loading.value = false;
    }
  };

  const panToAndShowBarInfo = (bar) => {
    if (!map.value || !window.google || !window.google.maps) {
      error.value = "地圖未初始化，無法顯示酒吧資訊。";
      if (onError) onError(error.value);
      return;
    }
    clearMarkers("search");
    if (currentMarker.value) {
      currentMarker.value.setMap(null);
    }
    closeInfoWindow();

    const position = new window.google.maps.LatLng(
      bar.location.lat,
      bar.location.lng
    );
    skipNextIdle = true;
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
        infoWindow.value.setPosition(position);
        infoWindow.value.setContent(formatBarInfoWindowContent(bar));
        infoWindow.value.open(map.value);
      }
    });
  };

  const getPlaceDetails = (placeId) => {
    return new Promise((resolve, reject) => {
      if (!placesService.value || !window.google || !window.google.maps) {
        reject(new Error("Places service not initialized."));
        return;
      }
      placesService.value.getDetails(
        {
          placeId,
          fields: [
            "name",
            "rating",
            "user_ratings_total",
            "formatted_address",
            "international_phone_number",
            "website",
            "opening_hours",
            "photos",
            "reviews",
            "geometry",
            "types",
            "editorial_summary",
          ],
          language: "zh-TW",
        },
        (place, status) => {
          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            place
          ) {
            resolve(place);
          } else {
            console.warn(`獲取地點詳情失敗 (${placeId}):`, status);
            resolve(null);
          }
        }
      );
    });
  };

  async function searchBarsInMapBounds(shouldShowLoading = false) {
    if (!map.value || !map.value.getBounds()) {
      console.warn("Map not ready for searchBarsInMapBounds, skipping.");
      return [];
    }
    if (isFetching.value) {
      console.log("Already fetching bars, skipping duplicate request.");
      return [];
    }
    isFetching.value = true;

    const bounds = map.value.getBounds();
    const center = bounds.getCenter();
    if (!center) {
      isFetching.value = false;
      return [];
    }

    if (shouldShowLoading) loading.value = true;

    try {
      const results = await textSearch("bar", center, 3000);
      const limitedResults = results.slice(0, 10);

      const barsWithDetails = await Promise.all(
        limitedResults.map(async (place) => {
          let details = null;
          try {
            details = await getPlaceDetails(place.place_id);
          } catch (e) {
            console.error(
              `Failed to get details for placeId ${place.place_id}:`,
              e
            );
          }

          const location = {
            lat:
              typeof place.geometry.location.lat === "function"
                ? place.geometry.location.lat()
                : place.geometry.location.lat,
            lng:
              typeof place.geometry.location.lng === "function"
                ? place.geometry.location.lng()
                : place.geometry.location.lng,
          };

          // 處理營業時間：優先使用 details 的 weekday_text
          const openingHoursText = details?.opening_hours?.weekday_text?.length > 0
            ? details.opening_hours.weekday_text[0]
            : (place.opening_hours?.open_now ? "目前營業中" : "營業時間未提供"); // 如果沒有 weekday_text，檢查是否營業中

          return {
            id: place.place_id,
            place_id: place.place_id,
            name: place.name || "未知名稱",
            location: location,
            rating: details?.rating || place.rating || 0,
            user_ratings_total:
              details?.user_ratings_total || place.user_ratings_total || 0,
            formatted_address:
              details?.formatted_address || place.formatted_address || "",
            international_phone_number:
              details?.international_phone_number || "",
            website: details?.website || "",
            imageUrl:
              details?.photos && details.photos.length > 0
                ? details.photos[0].getUrl({ maxWidth: 400, maxHeight: 300 })
                : place.photos && place.photos.length > 0
                ? place.photos[0].getUrl({ maxWidth: 400, maxHeight: 300 })
                : "",
            images:
              details?.photos && details.photos.length > 0
                ? details.photos.map((p) =>
                    p.getUrl({ maxWidth: 800, maxHeight: 600 })
                  )
                : place.photos && place.photos.length > 0
                ? place.photos.map((p) =>
                    p.getUrl({ maxWidth: 800, maxHeight: 600 })
                  )
                : [],
            googleReviews: details?.reviews || [],
            types: details?.types || place.types || [],
            // 轉換標籤為中文
            tags: mapGooglePlaceTypesToChinese(details?.types || place.types || []),
            opening_hours: details?.opening_hours || place.opening_hours || null,
            // 提供一個預先格式化好的營業時間文字
            openingHoursText: openingHoursText,
            description: details?.editorial_summary?.overview || "",
            isWishlisted: false,
            isOpenNow:
              details?.opening_hours?.open_now !== undefined
                ? details.opening_hours.open_now
                : null,
          };
        })
      );
      return barsWithDetails;
    } catch (err) {
      console.error("searchBarsInMapBounds error:", err);
      error.value = "搜尋地圖範圍內的酒吧時發生錯誤。";
      if (onError) onError(error.value);
      return [];
    } finally {
      if (shouldShowLoading) loading.value = false;
      isFetching.value = false;
    }
  }

  function onMapIdleHandler(...args) {
    if (skipNextIdle) {
      skipNextIdle = false;
      return;
    }
    if (onMapIdle) {
      onMapIdle(...args);
    }
  }

  onUnmounted(() => {
    clearMarkers("all");
    if (currentMarker.value) {
      currentMarker.value.setMap(null);
      currentMarker.value = null;
    }
    if (map.value) {
      window.google.maps.event.clearInstanceListeners(map.value);
    }

    map.value = null;
    infoWindow.value = null;
    autocompleteService.value = null;
    placesService.value = null;
    geocoder.value = null;

    googleMapsLoaded = false;
    googleMapsLoading = false;
    googleMapsLoadPromise = null;
  });

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
    getPlaceDetails,
    searchBarsInMapBounds,
  };
}