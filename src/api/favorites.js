import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

export const favoritesAPI = {
  // 獲取收藏列表
  async getFavorites(userId = null) {
    try {
      const params = userId ? { userId } : {};
      const response = await axios.get(`${API_BASE_URL}/favorites`, { params });
      return response.data.favorites || [];
    } catch (error) {
      console.error("Error fetching favorites:", error);
      throw error;
    }
  },

  // 切換收藏狀態（新增或移除）
  async toggleFavorite(barId, data) {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/favorites/${barId}`,
        data
      );
      return response.data;
    } catch (error) {
      console.error("Error toggling favorite:", error);
      throw error;
    }
  },

  // 檢查收藏狀態
  async checkFavoriteStatus(barId, googlePlaceId = null) {
    try {
      const params = googlePlaceId ? { googlePlaceId } : {};
      const response = await axios.get(
        `${API_BASE_URL}/favorites/${barId}/status`,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error("Error checking favorite status:", error);
      throw error;
    }
  },

  // 批量檢查收藏狀態
  async checkMultipleFavoriteStatus(identifiers) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/favorites/check-multiple`,
        { identifiers }
      );
      return response.data;
    } catch (error) {
      console.error("Error checking multiple favorite status:", error);
      throw error;
    }
  },

  // 移除收藏
  async removeFavorite(barId, googlePlaceId = null) {
    try {
      const params = googlePlaceId ? { googlePlaceId } : {};
      const response = await axios.delete(
        `${API_BASE_URL}/favorites/${barId}`,
        { params }
      );
      return response.data;
    } catch (error) {
      console.error("Error removing favorite:", error);
      throw error;
    }
  },
};