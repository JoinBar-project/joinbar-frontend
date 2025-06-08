import { defineStore } from 'pinia'

export const useTagStore = defineStore('tag', {
  state: () => ({
    tags: [], // [{id: 1, name: "xxx"}]
  }),
  getters: {
    tagsMap(state) {
      // 轉成 id->name 對照物件
      return Object.fromEntries(state.tags.map(t => [t.id, t.name]))
    }
  },
  actions: {
    async fetchTags() {
      const res = await fetch('/tags/list')
      this.tags = await res.json()
    }
  }
})