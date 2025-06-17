import { defineStore } from 'pinia'

export const useWishlistStore = defineStore('wishlist', {
  state: () => ({
    favorites: []
  }),
  actions: {
    add(bar) {
      if (!this.favorites.find(item => item.id === bar.id)) {
        this.favorites.push(bar)
      }
    },
    remove(barId) {
      this.favorites = this.favorites.filter(item => item.id !== barId)
    },
    toggle(bar) {
      const index = this.favorites.findIndex(item => item.id === bar.id)
      if (index === -1) {
        this.favorites.push(bar)
      } else {
        this.favorites.splice(index, 1)
      }
    }
  },
  getters: {
    isFavorite: (state) => (barId) => {
      return state.favorites.some(bar => bar.id === barId)
    }
  }
})

