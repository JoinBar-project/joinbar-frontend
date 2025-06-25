import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

export const favoritesAPI = {
  // 獲取收藏列表
  async getFavorites(userId = null) {
    try {
      const params = userId ? { userId } : {};
      const response = await axios.get(`${API_BASE_URL}/favorites`, { params });
      return response.data.favorites;
    } catch (error) {
      console.error("Error fetching favorites:", error);
      throw error;
    }
  },

  // 新增收藏
  async addFavorite(data) {
    try {
      const response = await axios.post(`${API_BASE_URL}/favorites`, data);
      return response.data;
    } catch (error) {
      console.error("Error adding favorite:", error);
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
