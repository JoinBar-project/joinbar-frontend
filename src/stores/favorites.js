import { defineStore } from 'pinia';

export const useFavoritesStore = defineStore('favorites', {
  state: () => ({
    favoriteBars: [], // 儲存收藏的酒吧列表
  }),
  getters: {
    // 獲取所有收藏的酒吧
    getFavoriteBars: (state) => state.favoriteBars,
    // 判斷特定酒吧是否已收藏
    isBarFavorited: (state) => (placeId) => {
      return state.favoriteBars.some(bar => bar.place_id === placeId);
    },
  },
  actions: {
    // 新增酒吧到收藏
    addFavoriteBar(bar) {
      // 確保不重複添加
      if (!this.favoriteBars.some(item => item.place_id === bar.place_id)) {
        this.favoriteBars.push(bar);
        console.log('酒吧已收藏:', bar.name, this.favoriteBars.length);
        // 可以選擇將數據儲存到 Local Storage 以在瀏覽器關閉後仍然保留
        this.saveFavoritesToLocalStorage();
      }
    },
    // 從收藏中移除酒吧
    removeFavoriteBar(placeId) {
      const initialLength = this.favoriteBars.length;
      this.favoriteBars = this.favoriteBars.filter(bar => bar.place_id !== placeId);
      if (this.favoriteBars.length < initialLength) {
        console.log('酒吧已從收藏中移除:', placeId, this.favoriteBars.length);
        this.saveFavoritesToLocalStorage();
      }
    },
    // 切換收藏狀態 (新增或移除)
    toggleFavorite(bar) {
      if (!bar || !bar.place_id) {
        console.warn("無法收藏/取消收藏，因為 bar 或 place_id 不存在。");
        return;
      }
      if (this.isBarFavorited(bar.place_id)) {
        this.removeFavoriteBar(bar.place_id);
      } else {
        this.addFavoriteBar(bar);
      }
    },
    // 將收藏列表儲存到 Local Storage
    saveFavoritesToLocalStorage() {
      try {
        localStorage.setItem('favoriteBars', JSON.stringify(this.favoriteBars));
      } catch (e) {
        console.error("儲存收藏到 Local Storage 失敗:", e);
      }
    },
    // 從 Local Storage 載入收藏列表
    loadFavoritesFromLocalStorage() {
      try {
        const storedFavorites = localStorage.getItem('favoriteBars');
        if (storedFavorites) {
          this.favoriteBars = JSON.parse(storedFavorites);
          console.log('從 Local Storage 載入收藏:', this.favoriteBars.length);
        }
      } catch (e) {
        console.error("從 Local Storage 載入收藏失敗:", e);
        localStorage.removeItem('favoriteBars'); // 清除可能的損壞數據
      }
    },
  },
});