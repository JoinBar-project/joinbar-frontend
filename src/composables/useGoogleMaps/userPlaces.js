// src/composable/useGoogleMaps/places.js
import {
  COMMON_PLACE_TYPES_TO_EXCLUDE,
  TAIWAN_BOUNDS,
  BAR_PLACE_TYPES,
} from "../googleMapsConstants";

export function createGoogleMapsPlaces(coreMapRefs) {
  const {
    google,
    placesService,
    autocompleteService,
    geocoderService,
    directionsService,
    directionsRenderer,
    map,
    isFetching,
    onError,
  } = coreMapRefs;

  const getPlacesService = () => {
    const currentMap = map();
    const currentGoogle = google();
    return currentGoogle && currentMap ? new currentGoogle.places.PlacesService(currentMap) : null;
  };

  const getPlacePredictions = async (input) => {
    const currentAutocompleteService = autocompleteService();
    const currentGoogle = google();
    if (!currentAutocompleteService || !currentGoogle) {
      console.error("AutocompleteService 未初始化。");
      onError && onError("地點建議服務未準備好，請檢查地圖載入。");
      return [];
    }
    try {
      const { predictions } =
        await currentAutocompleteService.getPlacePredictions({
          input: input,
          bounds: new currentGoogle.LatLngBounds(
            new currentGoogle.LatLng(TAIWAN_BOUNDS.south, TAIWAN_BOUNDS.west),
            new currentGoogle.LatLng(TAIWAN_BOUNDS.north, TAIWAN_BOUNDS.east)
          ),
          componentRestrictions: { country: "tw" },
          types: ["establishment", "geocode"],
        });
      return predictions;
    } catch (error) {
      console.error("獲取地點建議失敗:", error);
      onError && onError(`獲取地點建議失敗: ${error.message}`);
      return [];
    }
  };

  const getPlaceDetails = (placeId) => {
    const currentPlacesService = getPlacesService();
    const currentGoogle = google();
    return new Promise((resolve, reject) => {
      if (!currentPlacesService || !currentGoogle) {
        const errorMessage = "PlacesService 未初始化";
        onError && onError(errorMessage);
        reject(new Error(errorMessage));
        return;
      }
      const request = {
        placeId,
        fields: [
          "name",
          "geometry",
          "formatted_address",
          "place_id",
          "icon",
          "photos",
          "rating",
          "user_ratings_total",
          "opening_hours",
          "types",
          "url",
          "reviews",
          "international_phone_number",
          "website",
        ],
      };
      currentPlacesService.getDetails(request, (place, status) => {
        if (status === currentGoogle.places.PlacesServiceStatus.OK && place) {
          resolve(place);
        } else {
          const errorMessage = "取得詳細資料失敗: " + status;
          onError && onError(errorMessage);
          reject(new Error(errorMessage));
          return;
        }
      });
    });
  };

  const searchAndDisplayPlaces = async (query, maxResults = 20) => {
    const currentPlacesService = getPlacesService();
    const currentGoogle = google();
    if (!currentPlacesService || !currentGoogle) {
      const errorMessage = "PlacesService 或 Google Maps API 未初始化。";
      console.error(errorMessage);
      onError && onError(errorMessage);
      return { results: [], pagination: null };
    }

    if (isFetching) isFetching.value = true;
    let allResults = [];
    let lastPagination = null;

    try {
      return await new Promise((resolve, reject) => {
        const request = {
          query: query,
          fields: [
            "name",
            "geometry",
            "formatted_address",
            "place_id",
            "icon",
            "photos",
            "rating",
            "user_ratings_total",
            "opening_hours",
            "types",
            "url",
          ],
        };

        const handleResults = async (results, status, pagination) => {
          if (status === currentGoogle.places.PlacesServiceStatus.OK && results) {
            allResults = allResults.concat(results);
            lastPagination = pagination;
            if (
              pagination &&
              pagination.hasNextPage &&
              allResults.length < maxResults
            ) {
              setTimeout(() => {
                pagination.nextPage();
              }, 1000);
            } else {
              const finalResults = allResults.slice(0, maxResults);
              Promise.all(
                finalResults.map(async (place) => {
                  try {
                    const detail = await getPlaceDetails(place.place_id);
                    const tags = Array.isArray(detail.types)
                      ? detail.types.filter(
                          (type) => !COMMON_PLACE_TYPES_TO_EXCLUDE.includes(type)
                        )
                      : [];
                    const isOpen = detail.opening_hours ? detail.opening_hours.isOpen() : null;
                    const isBarLike = Array.isArray(detail.types)
                      ? detail.types.some((type) => BAR_PLACE_TYPES.includes(type))
                      : false;
                    return {
                      id: detail.place_id,
                      place_id: detail.place_id,
                      name: detail.name,
                      location: {
                        lat: detail.geometry.location.lat(),
                        lng: detail.geometry.location.lng(),
                      },
                      rating: detail.rating || 0,
                      reviews: detail.user_ratings_total || 0,
                      address: detail.formatted_address || "未知地址",
                      tags: tags,
                      opening_hours: detail.opening_hours,
                      is_open: isOpen,
                      imageUrl:
                        detail.photos && detail.photos.length > 0
                          ? detail.photos[0].getUrl({
                              maxWidth: 400,
                              maxHeight: 400,
                            })
                          : "",
                      images: detail.photos
                        ? detail.photos.map((p) =>
                            p.getUrl({ maxWidth: 800, maxHeight: 600 })
                          )
                        : [],
                      description: "點擊查看更多詳情...",
                      isWishlisted: false,
                      phone: detail.international_phone_number || null,
                      website: detail.website || null,
                      url: detail.url,
                      googleReviews: detail.reviews || [],
                      isBarLike: isBarLike,
                    };
                  } catch (e) {
                    console.warn(`獲取 ${place.name} 詳細資料失敗:`, e);
                    onError &&
                      onError(`獲取 ${place.name} 詳細資料失敗: ${e.message}`);
                    return {
                      id: place.place_id,
                      place_id: place.place_id,
                      name: place.name,
                      location: place.geometry?.location ? { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() } : null,
                    };
                  }
                })
              ).then((detailedBars) => {
                resolve({ results: detailedBars, pagination: lastPagination });
              });
            }
          } else if (
            status === currentGoogle.places.PlacesServiceStatus.ZERO_RESULTS
          ) {
            resolve({ results: [], pagination: null });
          } else {
            const errorMessage = `Places 搜尋失敗: ${status}`;
            console.error(errorMessage, results);
            onError && onError(errorMessage);
            reject(new Error(errorMessage));
          }
        };
        currentPlacesService.textSearch(request, handleResults);
      });
    } catch (err) {
      console.error("searchAndDisplayPlaces 發生錯誤:", err);
      onError && onError("搜尋地點時發生錯誤，請稍後再試。");
      return { results: [], pagination: null };
    } finally {
      if (isFetching) isFetching.value = false;
    }
  };

  const searchBarsInMapBounds = async (
    showLoadingOverlay = true,
    maxResults = 20
  ) => {
    const currentMap = map();
    const currentPlacesService = getPlacesService();
    const currentGoogle = google();
    if (!currentMap || !currentPlacesService || !currentGoogle) {
      const errorMessage = "地圖、PlacesService 或 Google Maps API 未準備好。";
      console.warn(errorMessage);
      onError && onError(errorMessage);
      return { results: [], pagination: null };
    }

    if (showLoadingOverlay) {
      if (isFetching) isFetching.value = true;
    }

    const bounds = currentMap.getBounds();
    // 增強檢查：如果地圖邊界無效，則及早終止
    if (!bounds || typeof bounds.isEmpty !== 'function' || bounds.isEmpty()) {
      if (showLoadingOverlay) {
        if (isFetching) isFetching.value = false;
      }
      const errorMessage = "無法取得有效地圖邊界。";
      console.warn(errorMessage);
      onError && onError(errorMessage); // 觸發 MapView 中的 onError 顯示給用戶
      return { results: [], pagination: null }; // 返回空結果
    }

    let allResults = [];
    let lastPagination = null;

    try {
      return await new Promise((resolve, reject) => {
        const request = {
          bounds: bounds,
          type: BAR_PLACE_TYPES.length > 0 ? BAR_PLACE_TYPES[0] : 'bar',
          rankBy: currentGoogle.places.RankBy.PROMINENCE,
        };

        const handleResults = async (results, status, pagination) => {
          if (status === currentGoogle.places.PlacesServiceStatus.OK && results) {
            allResults = allResults.concat(results);
            lastPagination = pagination;
            if (
              pagination &&
              pagination.hasNextPage &&
              allResults.length < maxResults
            ) {
              setTimeout(() => {
                pagination.nextPage();
              }, 1000);
            } else {
              const finalResults = allResults.slice(0, maxResults);
              Promise.all(
                finalResults.map(async (place) => {
                  try {
                    const detail = await getPlaceDetails(place.place_id);
                    const tags = Array.isArray(detail.types)
                      ? detail.types.filter(
                          (type) => !COMMON_PLACE_TYPES_TO_EXCLUDE.includes(type)
                        )
                      : [];
                    const isOpen = detail.opening_hours ? detail.opening_hours.isOpen() : null;
                    const isBarLike = Array.isArray(detail.types)
                      ? detail.types.some((type) => BAR_PLACE_TYPES.includes(type))
                      : false;
                    return {
                      id: detail.place_id,
                      place_id: detail.place_id,
                      name: detail.name,
                      location: {
                        lat: detail.geometry.location.lat(),
                        lng: detail.geometry.location.lng(),
                      },
                      rating: detail.rating || 0,
                      reviews: detail.user_ratings_total || 0,
                      address: detail.formatted_address || "未知地址",
                      tags: tags,
                      opening_hours: detail.opening_hours,
                      is_open: isOpen,
                      imageUrl:
                        detail.photos && detail.photos.length > 0
                          ? detail.photos[0].getUrl({
                              maxWidth: 400,
                              maxHeight: 400,
                            })
                          : "",
                      images: detail.photos
                        ? detail.photos.map((p) =>
                            p.getUrl({ maxWidth: 800, maxHeight: 600 })
                          )
                        : [],
                      description: "點擊查看更多詳情...",
                      isWishlisted: false,
                      phone: detail.international_phone_number || null,
                      website: detail.website || null,
                      url: detail.url,
                      googleReviews: detail.reviews || [],
                      isBarLike: isBarLike,
                    };
                  } catch (e) {
                    console.warn(`獲取 ${place.name} 詳細資料失敗:`, e);
                    onError &&
                      onError(`獲取 ${place.name} 詳細資料失敗: ${e.message}`);
                    return {
                      id: place.place_id,
                      place_id: place.place_id,
                      name: place.name,
                      location: place.geometry?.location ? { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() } : null,
                    };
                  }
                })
              ).then((detailedBars) => {
                resolve({ results: detailedBars, pagination: lastPagination });
              });
            }
          } else if (
            status === currentGoogle.places.PlacesServiceStatus.ZERO_RESULTS
          ) {
            resolve({ results: [], pagination: null });
          } else {
            const errorMessage = `Places 搜尋失敗: ${status}`;
            console.error(errorMessage, results);
            onError && onError(errorMessage);
            reject(new Error(errorMessage));
          }
        };
        currentPlacesService.nearbySearch(request, handleResults);
      });
    } catch (err) {
      console.error("searchBarsInMapBounds 發生錯誤:", err);
      onError && onError("搜尋地點時發生錯誤，請稍後再試。");
      return { results: [], pagination: null };
    } finally {
      if (showLoadingOverlay) {
        if (isFetching) isFetching.value = false;
      }
    }
  };

  const getGeocode = async (address) => {
    const currentGeocoderService = geocoderService();
    const currentGoogle = google();
    if (!currentGeocoderService) {
      const errorMessage = "GeocoderService 未初始化。";
      console.error(errorMessage);
      onError && onError(errorMessage);
      return null;
    }
    return new Promise((resolve, reject) => {
      currentGeocoderService.geocode({ address: address }, (results, status) => {
        if (status === currentGoogle.GeocoderStatus.OK && results[0]) {
          const location = {
            lat: results[0].geometry.location.lat(),
            lng: results[0].geometry.location.lng(),
          };
          resolve(location);
        } else {
          const errorMessage = `地理編碼失敗: ${status}`;
          console.error(errorMessage);
          onError && onError(errorMessage);
          reject(new Error(errorMessage));
        }
      });
    });
  };

  const calculateAndDisplayRoute = async (
    origin,
    destination,
    travelMode = "DRIVING"
  ) => {
    const currentDirectionsService = directionsService();
    const currentDirectionsRenderer = directionsRenderer();
    const currentGoogle = google();
    if (
      !currentDirectionsService ||
      !currentDirectionsRenderer ||
      !currentGoogle
    ) {
      const errorMessage = "DirectionsService 或 DirectionsRenderer 未初始化。";
      console.error(errorMessage);
      onError && onError(errorMessage);
      return;
    }

    if (origin === "" || destination === "") {
      console.warn("起點或終點為空，無法計算路線。");
      currentDirectionsRenderer.setDirections({ routes: [] });
      onError && onError("請輸入起點和終點以計算路線。");
      return;
    }

    try {
      const request = {
        origin: origin,
        destination: destination,
        travelMode: currentGoogle.maps.TravelMode[travelMode.toUpperCase()],
      };

      const response = await currentDirectionsService.route(request);

      if (response.status === currentGoogle.maps.DirectionsStatus.OK) {
        directionsRenderer().setMap(map()); // 確保渲染器綁定到地圖
        currentDirectionsRenderer.setDirections(response);
      } else {
        const errorMessage = "路線計算失敗:" + response.status;
        console.error(errorMessage);
        currentDirectionsRenderer.setDirections({ routes: [] });
        onError && onError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = `計算並顯示路線時發生錯誤: ${error.message}`;
      console.error(errorMessage);
      currentDirectionsRenderer.setDirections({ routes: [] });
      onError && onError(errorMessage);
      throw error;
    }
  };

  const clearDirections = () => {
    const currentDirectionsRenderer = directionsRenderer();
    if (currentDirectionsRenderer) {
      currentDirectionsRenderer.setDirections({ routes: [] });
      currentDirectionsRenderer.setMap(null); // 清除路線時解除與地圖的綁定
    }
  };

  const formatBarInfoWindowContent = (bar) => {
    if (!bar) return "<div>無資料</div>";

    const ratingStars = bar.rating
      ? "⭐".repeat(Math.round(bar.rating)) + ` (${bar.rating})`
      : "無評分";
    const reviewsCount = bar.reviews ? `(${bar.reviews} 則評論)` : "";

    const openNow = bar.opening_hours
      ? bar.opening_hours.isOpen()
        ? '<span style="color: green;">營業中</span>'
        : '<span style="color: red;">休息中</span>'
      : "無營業時間資訊";

    const address = bar.address ? bar.address : "無地址資訊";
    const tags =
      Array.isArray(bar.tags) && bar.tags.length > 0
        ? `<div style="font-size: 0.8em; color: #666;">${bar.tags.join(
            ", "
          )}</div>`
        : "";

    const googleMapsUrl = bar.url
      ? bar.url
      : bar.place_id
      ? `https://maps.google.com/?q=${encodeURIComponent(bar.name)}&query_place_id=${bar.place_id}` // 更正為標準的 Google Maps URL
      : `https://maps.google.com/?q=${encodeURIComponent(bar.name + " " + bar.address)}`;


    return `
      <div style="padding: 10px; font-family: Arial, sans-serif; max-width: 300px;">
        <h3 style="margin-top: 0; margin-bottom: 5px; font-size: 1.2em;">${
          bar.name
        }</h3>
        <p style="margin-bottom: 3px; font-size: 0.9em;">${ratingStars} ${reviewsCount}</p>
        <p style="margin-bottom: 3px; font-size: 0.9em;">${openNow}</p>
        <p style="margin-bottom: 3px; font-size: 0.9em;">${address}</p>
        ${tags}
        <a href="${
          googleMapsUrl
        }" target="_blank" style="color: #1a73e8; text-decoration: none; font-size: 0.9em;">在 Google 地圖中查看</a>
      </div>
    `;
  };

  return {
    getPlacePredictions,
    getPlaceDetails,
    searchAndDisplayPlaces,
    searchBarsInMapBounds,
    getGeocode,
    calculateAndDisplayRoute,
    clearDirections,
    formatBarInfoWindowContent,
  };
}