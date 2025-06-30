import { ref } from 'vue';

function waitForGoogleMaps(timeout = 5000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    function check() {
      if (window.google && window.google.maps && window.google.maps.places) {
        resolve();
      } else if (Date.now() - start > timeout) {
        reject(new Error('Google Maps API 載入逾時'));
      } else {
        setTimeout(check, 100);
      }
    }
    check();
  });
}

export function useGooglePlaceDetails() {
  const getPlaceDetails = async (placeId) => {
    await waitForGoogleMaps();
    return new Promise((resolve, reject) => {
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

async function patchGoogleDetails(bar) {
  if (!bar.googlePlaceId) return;
  try {
    const detail = await getPlaceDetails(bar.googlePlaceId);
    if (detail) {
      bar.imageUrl = detail.photos?.[0]?.getUrl({ maxWidth: 400 }) || bar.imageUrl;
      bar.images = detail.photos?.map(p => p.getUrl({ maxWidth: 800 })) || bar.images;
      bar.rating = detail.rating;
      bar.reviews = detail.user_ratings_total;
      bar.openingHoursText = detail.opening_hours?.weekday_text?.join('\\n') || '';
      bar.website = detail.website;
      bar.googleReviews = detail.reviews || [];
    }
  } catch (e) {
    // fallback 預設圖片
    if (!bar.imageUrl) bar.imageUrl = 'https://placehold.co/800x600/decdd5/860914?text=No+Image';
    if (!bar.images || bar.images.length === 0) bar.images = [bar.imageUrl];
  }
} 