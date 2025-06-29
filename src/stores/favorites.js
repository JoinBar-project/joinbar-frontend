import { ref } from "vue";
import { defineStore } from "pinia";
import { favoritesAPI } from "@/api/favorites";

export const useFavoritesStore = defineStore("favorites", () => {
  const favoriteBars = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // 從後端獲取收藏列表
  async function fetchFavorites(userId = null) {
    loading.value = true;
    error.value = null;

    try {
      const favorites = await favoritesAPI.getFavorites(userId);
      favoriteBars.value = favorites;
    } catch (err) {
      error.value = err.message;
      console.error("Failed to fetch favorites:", err);
    } finally {
      loading.value = false;
    }
  }

  // 檢查是否已收藏
  function isFavorited(identifier) {
    return favoriteBars.value.some(
      (bar) =>
        bar.barId === identifier ||
        bar.googlePlaceId === identifier ||
        bar.place_id === identifier ||
        bar.id === identifier
    );
  }

  // 切換收藏狀態
  async function toggleFavorite(bar, folderId = null) {
    loading.value = true;
    error.value = null;

    try {
      // 取得識別碼
      const googlePlaceId = bar.place_id || bar.googlePlaceId;
      const barId = bar.id || bar.barId || 'google'; // 如果沒有 barId，使用 'google'
      
      // 檢查當前收藏狀態
      const isCurrentlyFavorited = isFavorited(googlePlaceId || barId);
      
      // 準備請求資料
      const requestData = {
        isFavorite: !isCurrentlyFavorited, // 切換狀態
        userId: null, // 如果有使用者系統，這裡要傳入實際的 userId
        folderId: folderId
      };

      // 如果是從 Google Maps 新增收藏，需要額外資料
      if (!isCurrentlyFavorited && googlePlaceId && (!bar.id || bar.id === 'google')) {
        requestData.googlePlaceId = googlePlaceId;
        requestData.barData = {
          name: bar.name,
          address: bar.formatted_address || bar.address || bar.vicinity,
          latitude: bar.geometry?.location ? 
            (typeof bar.geometry.location.lat === 'function' ? 
              bar.geometry.location.lat() : bar.geometry.location.lat) :
            bar.location?.lat,
          longitude: bar.geometry?.location ? 
            (typeof bar.geometry.location.lng === 'function' ? 
              bar.geometry.location.lng() : bar.geometry.location.lng) :
            bar.location?.lng,
          imageUrl: bar.photos?.[0] ? 
            (bar.photos[0].getUrl ? 
              bar.photos[0].getUrl({ maxWidth: 400 }) : 
              bar.photos[0]) :
            (bar.imageUrl || bar.images?.[0]),
          rating: bar.rating || 0,
          reviews: bar.user_ratings_total || bar.reviews || 0,
          website: bar.website,
          openingHoursText: bar.opening_hours?.weekday_text ? 
            bar.opening_hours.weekday_text.join('\n') : 
            bar.openingHoursText,
          tags: bar.types || bar.tags || []
        };
      } else if (googlePlaceId) {
        requestData.googlePlaceId = googlePlaceId;
      }

      // 呼叫 API
      const response = await favoritesAPI.toggleFavorite(barId, requestData);
      
      // 更新本地狀態
      if (response.isFavorite) {
        // 新增到收藏
        const favoriteBar = {
          ...response.favorite,
          // 確保有完整資訊
          name: bar.name,
          address: bar.formatted_address || bar.address || bar.vicinity,
          imageUrl: requestData.barData?.imageUrl || bar.imageUrl || bar.images?.[0],
          rating: bar.rating,
          reviews: bar.user_ratings_total || bar.reviews || 0,
          latitude: requestData.barData?.latitude || bar.latitude || bar.location?.lat,
          longitude: requestData.barData?.longitude || bar.longitude || bar.location?.lng,
          tags: bar.types || bar.tags || [],
          opening_hours: bar.opening_hours,
          openingHoursText: requestData.barData?.openingHoursText || bar.openingHoursText,
          website: bar.website,
          googlePlaceId: googlePlaceId
        };
        
        // 檢查是否已存在，避免重複
        const existingIndex = favoriteBars.value.findIndex(
          f => f.barId === favoriteBar.barId
        );
        
        if (existingIndex === -1) {
          favoriteBars.value.push(favoriteBar);
        } else {
          // 更新現有資料
          favoriteBars.value[existingIndex] = favoriteBar;
        }
      } else {
        // 從收藏中移除
        favoriteBars.value = favoriteBars.value.filter(
          f => f.googlePlaceId !== googlePlaceId && f.barId !== response.favorite?.barId
        );
      }
      
      return response.isFavorite;
    } catch (err) {
      error.value = err.response?.data?.message || err.message || '操作失敗';
      console.error("Failed to toggle favorite:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // 清除錯誤
  function clearError() {
    error.value = null;
  }

  return {
    favoriteBars,
    loading,
    error,
    fetchFavorites,
    isFavorited,
    toggleFavorite,
    clearError,
  };
});