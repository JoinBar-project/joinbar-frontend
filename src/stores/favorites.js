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

  // 檢查是否已收藏（支援 barId 或 googlePlaceId）
  function isFavorited(identifier) {
    return favoriteBars.value.some(
      (bar) =>
        bar.barId === identifier ||
        bar.googlePlaceId === identifier ||
        bar.place_id === identifier
    );
  }

  // 切換收藏狀態
  async function toggleFavorite(bar) {
    loading.value = true;
    error.value = null;

    try {
      // 判斷是否已收藏
      const isCurrentlyFavorited = isFavorited(
        bar.place_id || bar.googlePlaceId || bar.id
      );

      if (isCurrentlyFavorited) {
        // 移除收藏
        const favoriteToRemove = favoriteBars.value.find(
          (f) =>
            f.googlePlaceId === (bar.place_id || bar.googlePlaceId) ||
            f.barId === bar.id
        );

        if (favoriteToRemove) {
          await favoritesAPI.removeFavorite(
            favoriteToRemove.barId,
            favoriteToRemove.googlePlaceId
          );
          // 更新本地狀態
          favoriteBars.value = favoriteBars.value.filter(
            (f) => f.barId !== favoriteToRemove.barId
          );
        }
      } else {
        // 新增收藏
        const requestData = prepareAddFavoriteData(bar);
        const response = await favoritesAPI.addFavorite(requestData);

        if (!response.alreadyFavorited) {
          // 更新本地狀態
          favoriteBars.value.push({
            ...response.favorite,
            // 確保有完整資訊
            name: bar.name,
            address: bar.address || bar.formatted_address,
            imageUrl: bar.imageUrl || bar.images?.[0],
            rating: bar.rating,
            reviews: bar.reviews || bar.user_ratings_total,
            latitude: bar.latitude || bar.location?.lat,
            longitude: bar.longitude || bar.location?.lng,
            tags: bar.tags || [],
            opening_hours: bar.opening_hours,
            phone: bar.phone || bar.international_phone_number,
            website: bar.website,
          });
        }
      }

      return !isCurrentlyFavorited; // 返回新的收藏狀態
    } catch (err) {
      error.value = err.message;
      console.error("Failed to toggle favorite:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  // 準備新增收藏的資料
  function prepareAddFavoriteData(bar) {
    // 從 Google Maps 來的資料（沒有 barId）
    if (bar.place_id && !bar.id) {
      return {
        googlePlaceId: bar.place_id,
        barData: {
          name: bar.name,
          address: bar.formatted_address || bar.address,
          latitude: bar.geometry?.location?.lat() || bar.location?.lat,
          longitude: bar.geometry?.location?.lng() || bar.location?.lng,
          imageUrl:
            bar.photos?.[0]?.getUrl?.({ maxWidth: 400 }) || bar.images?.[0],
          rating: bar.rating,
          reviews: bar.user_ratings_total || bar.reviews,
          phone: bar.international_phone_number || bar.phone,
          website: bar.website,
          openingHoursText: bar.opening_hours?.weekday_text?.join("\n"),
          tags: bar.types || bar.tags || [],
        },
      };
    }

    // 從資料庫來的資料（有 barId）
    return {
      barId: bar.id,
      googlePlaceId: bar.googlePlaceId,
    };
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
