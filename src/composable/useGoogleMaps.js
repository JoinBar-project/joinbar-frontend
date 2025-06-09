import { ref, shallowRef, onUnmounted } from "vue";
let googleMapsLoading = false;
let googleMapsLoaded = false;
let googleMapsLoadPromise = null;
export function useGoogleMaps(mapContainerRef, options) {
  const {
    googleMapsApiKey,
    defaultCenter = { lat: 25.033, lng: 121.5654 },
    defaultZoom = 12,
  } = options;
  const map = shallowRef(null);
  const markers = ref([]);
  const searchMarkers = ref([]);
  const infoWindow = shallowRef(null);
  const autocompleteService = shallowRef(null);
  const placesService = shallowRef(null);
  const geocoder = shallowRef(null);
  const currentMarker = shallowRef(null);
  const loading = ref(false);
  const error = ref(null);
  const isBarLike = (place) => {
    const nameLower = place.name ? place.name.toLowerCase() : "";
    const types = place.types || [];
    const tags = place.tags || [];
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
      const script = document.createElement("script");
      if (!googleMapsApiKey) {
        const errMsg = "Google Maps API Key is not configured.";
        error.value = errMsg;
        loading.value = false;
        googleMapsLoading = false;
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
    if (!map.value) throw new Error("Map not initialized.");
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
        ? { url: finalIcon, scaledSize: new window.google.maps.Size(32, 32) }
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
  const displayBarsOnMap = (barsToMark) => {
    if (!map.value) return;
    clearMarkers("bars");
    closeInfoWindow();
    if (currentMarker.value) {
      currentMarker.value.setMap(null);
    }
    clearMarkers("search");
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
        null,
        "bars",
        bar
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
          clearMarkers("all");
          closeInfoWindow();
          if (!currentMarker.value) {
            currentMarker.value = addMarker(
              location,
              "Your Location",
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
              null,
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
  const panToAndShowBarInfo = (bar) => {
    if (!map.value) {
      error.value = "地圖未初始化，無法顯示酒吧資訊。";
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
    formatBarInfoWindowContent,
    formatPlaceInfoWindowContent,
  };
}
