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
    const map = typeof coreMapRefs.map === 'function' ? coreMapRefs.map() : coreMapRefs.map;
    const google = typeof coreMapRefs.google === 'function' ? coreMapRefs.google() : coreMapRefs.google;
    return google && map ? new google.places.PlacesService(map) : null;
  };

  const getPlacePredictions = async (input) => {
    const autocompleteService = coreMapRefs.autocompleteService();
    const google = typeof coreMapRefs.google === 'function' ? coreMapRefs.google() : coreMapRefs.google;
    if (!autocompleteService || !google) {
      console.error("AutocompleteService 未初始化。");
      onError && onError("地點建議服務未準備好，請檢查地圖載入。");
      return [];
    }
    try {
      const { predictions } =
        await autocompleteService.getPlacePredictions({
          input: input,
          bounds: new google.LatLngBounds(
            new google.LatLng(TAIWAN_BOUNDS.south, TAIWAN_BOUNDS.west),
            new google.LatLng(TAIWAN_BOUNDS.north, TAIWAN_BOUNDS.east)
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
    const placesService = getPlacesService();
    const google = typeof coreMapRefs.google === 'function' ? coreMapRefs.google() : coreMapRefs.google;
    return new Promise((resolve, reject) => {
      if (!placesService || !google) {
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
      placesService.getDetails(request, (place, status) => {
        if (status === google.places.PlacesServiceStatus.OK && place) {
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
    const placesService = getPlacesService();
    const google = typeof coreMapRefs.google === 'function' ? coreMapRefs.google() : coreMapRefs.google;
    if (!placesService || !google) {
      const errorMessage = "PlacesService 或 Google Maps API 未初始化。";
      console.error(errorMessage);
      onError && onError(errorMessage);
      return [];
    }

    if (coreMapRefs.isFetching) coreMapRefs.isFetching.value = true;
    let allResults = [];

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
          if (status === google.places.PlacesServiceStatus.OK && results) {
            allResults = allResults.concat(results);
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
                resolve(detailedBars);
              });
            }
          } else if (
            status === google.places.PlacesServiceStatus.ZERO_RESULTS
          ) {
            resolve([]);
          } else {
            const errorMessage = `Places 搜尋失敗: ${status}`;
            console.error(errorMessage, results);
            onError && onError(errorMessage);
            reject(new Error(errorMessage));
          }
        };

        placesService.textSearch(request, handleResults);
      });
    } catch (err) {
      console.error("searchAndDisplayPlaces 發生錯誤:", err);
      onError && onError("搜尋地點時發生錯誤，請稍後再試。");
      return [];
    } finally {
      if (coreMapRefs.isFetching) coreMapRefs.isFetching.value = false;
    }
  };

  const searchBarsInMapBounds = async (
    showLoadingOverlay = true,
    maxResults = 20
  ) => {
    const map = coreMapRefs.map;
    const placesService = getPlacesService();
    const google = typeof coreMapRefs.google === 'function' ? coreMapRefs.google() : coreMapRefs.google;
    if (!map || !placesService || !google) {
      const errorMessage = "地圖、PlacesService 或 Google Maps API 未準備好。";
      console.warn(errorMessage);
      onError && onError(errorMessage);
      return [];
    }

    if (showLoadingOverlay) {
      if (coreMapRefs.isFetching) coreMapRefs.isFetching.value = true;
    }

    const bounds = map.getBounds();
    if (!bounds) {
      if (showLoadingOverlay) {
        if (coreMapRefs.isFetching) coreMapRefs.isFetching.value = false;
      }
      console.warn("無法取得地圖邊界。");
      onError && onError("無法取得地圖邊界，請稍後再試。");
      return [];
    }

    let allResults = [];

    try {
      return await new Promise((resolve, reject) => {
        const request = {
          bounds: bounds,
          type: BAR_PLACE_TYPES,
          rankBy: google.places.RankBy.PROMINENCE,
        };

        const handleResults = async (results, status, pagination) => {
          if (status === google.places.PlacesServiceStatus.OK && results) {
            allResults = allResults.concat(results);
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
                resolve(detailedBars);
              });
            }
          } else if (
            status === google.places.PlacesServiceStatus.ZERO_RESULTS
          ) {
            resolve([]);
          } else {
            const errorMessage = `Places 搜尋失敗: ${status}`;
            console.error(errorMessage, results);
            onError && onError(errorMessage);
            reject(new Error(errorMessage));
          }
        };
        placesService.nearbySearch(request, handleResults);
      });
    } catch (err) {
      console.error("searchBarsInMapBounds 發生錯誤:", err);
      onError && onError("搜尋地點時發生錯誤，請稍後再試。");
      return [];
    } finally {
      if (showLoadingOverlay) {
        if (coreMapRefs.isFetching) coreMapRefs.isFetching.value = false;
      }
    }
  };

  const getGeocode = async (address) => {
    const geocoderService = coreMapRefs.geocoderService();
    const google = typeof coreMapRefs.google === 'function' ? coreMapRefs.google() : coreMapRefs.google;
    if (!geocoderService) {
      const errorMessage = "GeocoderService 未初始化。";
      console.error(errorMessage);
      onError && onError(errorMessage);
      return null;
    }
    return new Promise((resolve, reject) => {
      geocoderService.geocode({ address: address }, (results, status) => {
        if (status === google.GeocoderStatus.OK && results[0]) {
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
    const directionsService = coreMapRefs.directionsService();
    const directionsRenderer = coreMapRefs.directionsRenderer();
    const google = typeof coreMapRefs.google === 'function' ? coreMapRefs.google() : coreMapRefs.google;
    if (
      !directionsService ||
      !directionsRenderer ||
      !google
    ) {
      const errorMessage = "DirectionsService 或 DirectionsRenderer 未初始化。";
      console.error(errorMessage);
      onError && onError(errorMessage);
      return;
    }

    if (origin === "" || destination === "") {
      console.warn("起點或終點為空，無法計算路線。");
      directionsRenderer.setDirections({ routes: [] });
      onError && onError("請輸入起點和終點以計算路線。");
      return;
    }

    try {
      const request = {
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode[travelMode.toUpperCase()],
      };

      const response = await directionsService.route(request);

      if (response.status === google.maps.DirectionsStatus.OK) {
        directionsRenderer.setDirections(response);
      } else {
        const errorMessage = "路線計算失敗:" + response.status;
        console.error(errorMessage);
        directionsRenderer.setDirections({ routes: [] });
        onError && onError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = `計算並顯示路線時發生錯誤: ${error.message}`;
      console.error(errorMessage);
      directionsRenderer.setDirections({ routes: [] });
      onError && onError(errorMessage);
      throw error;
    }
  };

  const clearDirections = () => {
    const directionsRenderer = coreMapRefs.directionsRenderer();
    if (directionsRenderer) {
      directionsRenderer.setDirections({ routes: [] });
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
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(bar.name + " " + bar.address)}&query_place_id=${bar.place_id}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(bar.name + " " + bar.address)}`;


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