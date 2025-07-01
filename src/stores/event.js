import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

export const useEventStore = defineStore('event', () => {
  const event = ref(null)
  const tagIds = ref([])
  const events = ref([])
  const loading = ref(false)
  const error = ref(null)

  const createEvent = async (payload) => {
    loading.value = true
    try {
      const res = await axios.post('/api/event/create', payload)
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
      const res = await axios.get('/api/event/all')
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
      const res = await axios.put(`/api/event/update/${id}`, payload)
      const index = events.value.findIndex(e => e.id == id)
      if (index !== -1) {
        events.value[index] = { ...events.value[index], ...res.data }
      }
      event.value = res.data
      error.value = null
    } catch (e) {
      error.value = e.response?.data?.message || e.message
    } finally {
      loading.value = false
    }
  }

  const deleteEvent = async (id) => {
    loading.value = true;
    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`/api/event/delete/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 軟刪除後更新本地資料
      const index = events.value.findIndex(e => e.id == id);
      if (index !== -1) {
        events.value[index].status = 2;
      }

      event.value = null;
      error.value = null;
    } catch (e) {
      error.value = e.response?.data?.message || e.message || '刪除失敗';
      throw new Error(error.value);
    } finally {
      loading.value = false;
    }
  };

  const fetchEvent = async (id) => {
    loading.value = true
    try {
      const res = await axios.get(`/api/event/${id}`)
      event.value = res.data.event
      tagIds.value = res.data.tags || []
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