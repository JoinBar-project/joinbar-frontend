import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCartStore = defineStore('cart', () => {
  const sampleProducts = [
    {
      id: 1,
      name: '精釀啤酒｜琥珀艾爾',
      price: 120,
      spec: '330ml 瓶裝',
      quantity: 1,
      image: 'https://placehold.co/80x80?text=Beer',
    },
    {
      id: 2,
      name: '威士忌｜格蘭菲迪 12 年',
      price: 980,
      spec: '700ml 原裝',
      quantity: 1,
      image: 'https://placehold.co/80x80?text=Whisky',
    },
  ]

  const items = ref(sampleProducts)

  const addItem = (item) => {
    const existing = items.value.find((i) => i.id === item.id)
    if (!existing) {
      items.value.push({ ...item, quantity: 1 })
    }
  }

  const removeItem = (id) => {
    const index = items.value.findIndex((i) => i.id === id)
    if (index !== -1) {
      items.value.splice(index, 1)
    }
  }

  const clearCart = () => (items.value = [])

  return { items, addItem, removeItem, clearCart }
}, {
  persist: true
})