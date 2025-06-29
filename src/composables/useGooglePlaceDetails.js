import { ref } from 'vue';

export function useGooglePlaceDetails() {
  const getPlaceDetails = (placeId) => {
    return new Promise((resolve, reject) => {
      if (!window.google || !window.google.maps) {
        reject(new Error('Google Maps 未初始化'));
        return;
      }
      const service = new window.google.maps.places.PlacesService(document.createElement('div'));
      service.getDetails(
        {
          placeId,
          fields: [
            "name", "geometry", "formatted_address", "place_id", "photos",
            "rating", "user_ratings_total", "opening_hours", "types", "url",
            "reviews", "international_phone_number", "website"
          ]
        },
        (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
            resolve(place);
          } else {
            reject(new Error('取得詳細資料失敗: ' + status));
          }
        }
      );
    });
  };

  return { getPlaceDetails };
} 