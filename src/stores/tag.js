import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

export const useTagStore = defineStore('tag', () => {
  
  const tags = ref([])

  const tagsMap = computed(() => {
    return Object.fromEntries(tags.value.map(t => [t.id, t.name]))
  })

  const fetchTags = async () => {
    const res = await axios.get(`${API_BASE_URL}/api/tags/list`)
    tags.value = res.data
  }

  return {
    tags,
    tagsMap,
    fetchTags,
  }
})