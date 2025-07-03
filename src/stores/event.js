import { defineStore } from 'pinia'
import { ref } from 'vue'
import apiClient from '@/api/axios'

export const useEventStore = defineStore('event', () => {
  const event = ref(null)
  const tagIds = ref([])
  const events = ref([])
  const loading = ref(false)
  const error = ref(null)

  const createEvent = async (payload) => {
    loading.value = true
    error.value = null
    try {
      const res = await apiClient.post('/event/create', payload) 
      event.value = res.data.event
      events.value.push(res.data.event)
      return { success: true, data: res.data.event }
    } catch (e) {
      error.value = e.response?.data?.message || e.message
      console.error('創建活動失敗:', e)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const fetchEvents = async () => {
    loading.value = true
    error.value = null
    try {
      const res = await apiClient.get('/event/all') 
      events.value = res.data
      return { success: true, data: res.data }
    } catch (e) {
      error.value = e.response?.data?.message || e.message
      console.error('獲取活動列表失敗:', e)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const updateEvent = async (id, payload) => {
    loading.value = true
    error.value = null
    try {
      const res = await apiClient.put(`/event/update/${id}`, payload) 
      
      // 更新本地事件列表
      const index = events.value.findIndex(e => e.id == id)
      if (index !== -1) {
        events.value[index] = { ...events.value[index], ...res.data }
      }
      
      event.value = res.data
      return { success: true, data: res.data }
    } catch (e) {
      error.value = e.response?.data?.message || e.message
      console.error('更新活動失敗:', e)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const deleteEvent = async (id) => {
    loading.value = true
    error.value = null
    try {
      await apiClient.delete(`/event/delete/${id}`) 

      // 軟刪除後更新本地資料
      const index = events.value.findIndex(e => e.id == id)
      if (index !== -1) {
        events.value[index].status = 2 // 假設 2 代表已刪除
      }

      event.value = null
      return { success: true } // ✅ 統一返回格式
    } catch (e) {
      error.value = e.response?.data?.message || e.message || '刪除失敗'
      console.error('刪除活動失敗:', e)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const fetchEvent = async (id) => {
    loading.value = true
    error.value = null
    try {
      const res = await apiClient.get(`/event/${id}`) 
      event.value = res.data.event
      tagIds.value = res.data.tags || []
      return { success: true, data: res.data }
    } catch (e) {
      error.value = e.response?.data?.message || e.message
      console.error('獲取活動詳情失敗:', e)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const clearEvent = () => {
    event.value = null
    error.value = null
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // 狀態
    event,
    events,
    tagIds,
    loading,
    error,
    
    // 方法
    createEvent,
    fetchEvents,
    updateEvent,
    deleteEvent,
    fetchEvent,
    clearEvent,
    clearError,
  }
})