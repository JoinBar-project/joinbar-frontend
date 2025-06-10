import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export const useTagStore = defineStore('tag', () => {
  
  const tags = ref([])

  const tagsMap = computed(() => {
    return Object.fromEntries(tags.value.map(t => [t.id, t.name]))
  })

  const fetchTags = async () => {
    const res = await axios.get('/tags/list')
    tags.value = res.data
  }

  return {
    tags,
    tagsMap,
    fetchTags,
  }
})