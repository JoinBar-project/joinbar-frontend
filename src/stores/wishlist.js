import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useWishlistStore = defineStore('wishlist', () => {
  // ✅ 預設就有兩筆收藏酒吧（你可以放你要的假資料）
  const wishlist = ref([
    {
      id: 'bar001',
      name: '清吧一號',
      address: '台北市信義區香堤大道一段88號',
      rating: 4.5,
      tags: ['雞尾酒', '輕音樂'],
      image: '/mock-bar-image.jpg',
      description: '這是一家很放鬆的酒吧，適合小酌與朋友聊天',
      isWishlisted: true
    },
    {
      id: 'bar002',
      name: '微醺小酒館',
      address: '台北市大安區和平東路二段66號',
      rating: 4.2,
      tags: ['葡萄酒', '約會'],
      image: '/mock-bar-image-2.jpg',
      description: '氣氛浪漫，飲品選擇豐富',
      isWishlisted: true
    }
  ])

  const toggle = (bar) => {
    const index = wishlist.value.findIndex(b => b.id === bar.id || b.place_id === bar.place_id)
    if (index !== -1) {
      wishlist.value.splice(index, 1)
    } else {
      wishlist.value.push({ ...bar, isWishlisted: true })
    }
  }

  const isWishlisted = (barId) => {
    return wishlist.value.some(bar => bar.id === barId || bar.place_id === barId)
  }

  return { wishlist, toggle, isWishlisted }
})
