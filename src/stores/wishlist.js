import { ref } from 'vue'
import { defineStore } from 'pinia'

// Composition API 形式
export const useWishlistStore = defineStore('wishlist', () => {
  const wishlist = ref([])
  // 切換收藏狀態
  const toggle = (bar) => {
    const index = wishlist.value.findIndex(b => b.id === bar.id || b.place_id === bar.place_id)
    if (index !== -1) {
      wishlist.value.splice(index, 1)
    } else {
      wishlist.value.push({ ...bar, isWishlisted: true })
    }
  }

  return { wishlist, toggle }
})

