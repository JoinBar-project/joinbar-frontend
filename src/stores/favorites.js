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
    if (!identifier) return false;
    
    return favoriteBars.value.some(
      (bar) =>
        bar.barId === identifier ||
        bar.googlePlaceId === identifier ||
        bar.place_id === identifier ||
        bar.id === identifier
    );
  }

  // 獲取收藏的酒吧資料
  function getFavoriteBar(identifier) {
    if (!identifier) return null;
    
    return favoriteBars.value.find(
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
      // barId 若為 Google Place 資料，直接用 'google'，否則用資料庫 id
      const barId = bar.id || bar.barId || 'google';
      if (!googlePlaceId && !barId) {
        throw new Error('缺少酒吧識別碼');
      }
      // 檢查當前收藏狀態
      const isCurrentlyFavorited = isFavorited(googlePlaceId || barId);
      // 準備請求資料
      const requestData = {
        isFavorite: !isCurrentlyFavorited,
        folderId: folderId,
      };
      // 如果是從 Google Maps 新增收藏，需要額外資料
      if (!isCurrentlyFavorited && googlePlaceId) {
        requestData.googlePlaceId = googlePlaceId;
        // barData 組裝防呆
        requestData.barData = {
          name: bar.name,
          address: bar.formatted_address || bar.address || bar.vicinity || '',
          latitude: bar.geometry?.location
            ? (typeof bar.geometry.location.lat === 'function'
                ? bar.geometry.location.lat()
                : bar.geometry.location.lat)
            : bar.location?.lat || bar.latitude,
          longitude: bar.geometry?.location
            ? (typeof bar.geometry.location.lng === 'function'
                ? bar.geometry.location.lng()
                : bar.geometry.location.lng)
            : bar.location?.lng || bar.longitude,
        };
      } else if (googlePlaceId) {
        requestData.googlePlaceId = googlePlaceId;
      }
      console.log('toggleFavorite', barId, requestData);
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
          images: bar.images || [],
          rating: bar.rating,
          reviews: bar.user_ratings_total || bar.reviews || 0,
          latitude: requestData.barData?.latitude || bar.latitude || bar.location?.lat,
          longitude: requestData.barData?.longitude || bar.longitude || bar.location?.lng,
          tags: bar.types || bar.tags || [],
          opening_hours: bar.opening_hours,
          openingHoursText: requestData.barData?.openingHoursText || bar.openingHoursText,
          website: bar.website,
          phone: bar.international_phone_number || bar.phone,
          priceLevel: bar.price_level,
          url: bar.url,
          googlePlaceId: googlePlaceId,
          googleReviews: bar.googleReviews || []
        };
        
        // 檢查是否已存在，避免重複
        const existingIndex = favoriteBars.value.findIndex(
          f => f.barId === favoriteBar.barId || f.googlePlaceId === googlePlaceId
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

  // 批量更新收藏狀態
  async function updateMultipleFavoriteStatus(bars) {
    try {
      const identifiers = bars.map(bar => 
        bar.place_id || bar.googlePlaceId || bar.id
      ).filter(Boolean);
      
      if (identifiers.length === 0) return;
      
      const statuses = await favoritesAPI.checkMultipleFavoriteStatus(identifiers);
      
      // 更新每個酒吧的收藏狀態
      bars.forEach(bar => {
        const identifier = bar.place_id || bar.googlePlaceId || bar.id;
        if (identifier && statuses[identifier] !== undefined) {
          bar.isWishlisted = statuses[identifier];
        }
      });
    } catch (err) {
      console.error("Failed to update multiple favorite status:", err);
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
    getFavoriteBar,
    toggleFavorite,
    updateMultipleFavoriteStatus,
    clearError,
  };
});