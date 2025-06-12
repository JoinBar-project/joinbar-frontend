import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

axios.defaults.baseURL = 'http://localhost:3000'

export const useEventStore = defineStore('event', () => {
  // state
  const event = ref(null)        // 單一活動資訊
  const events = ref([])         // 活動列表
  const loading = ref(false)
  const error = ref(null)

  // actions
  const createEvent = async (payload) => {
    loading.value = true
    try {
      const res = await axios.post('/event/create', payload)
      event.value = res.data.event
      events.value.push(res.data.event)
      error.value = null
    } catch (e) {
      error.value = e.response?.data?.message || e.message
    } finally {
      loading.value = false
    }
  }

  const fetchEvents = async () => {
    loading.value = true
    try {
      const res = await axios.get('/event/all')
      events.value = res.data
      error.value = null
    } catch (e) {
      error.value = e.response?.data?.message || e.message
    } finally {
      loading.value = false
    }
  }

  const updateEvent = async (id, payload) => {
    loading.value = true
    try {
      const res = await axios.put(`/event/update/${id}`, payload)
      event.value = res.data
      error.value = null
    } catch (e) {
      error.value = e.response?.data?.message || e.message
    } finally {
      loading.value = false
    }
  }

  const deleteEvent = async (id) => {
    loading.value = true
    try {
      await axios.delete(`/event/delete/${id}`)
      events.value = events.value.filter(e => e.id !== id)
      event.value = null
      error.value = null
    } catch (e) {
      error.value = e.response?.data?.message || e.message
    } finally {
      loading.value = false
    }
  }

  const fetchEvent = async (id) => {
    loading.value = true
    try {
      const res = await axios.get(`/event/${id}`)
      events.value = res.data.filter(e => e.status !== 2) // 過濾軟刪除的活動
      error.value = null
    } catch (e) {
      error.value = e.response?.data?.message || e.message
    } finally {
      loading.value = false
    }
  }

  const clearEvent = () => {
    event.value = null
    error.value = null
  }

  return {
    event,
    events,
    loading,
    error,
    createEvent,
    fetchEvents,
    updateEvent,
    deleteEvent,
    fetchEvent,
    clearEvent,
  }
})