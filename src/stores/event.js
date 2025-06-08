import { defineStore } from 'pinia'
import axios from 'axios'

axios.defaults.baseURL = 'http://localhost:3000'

export const useEventStore = defineStore('event', {
  state: () => ({
    event: null,   // 儲存單一活動資訊
    events: [],    // 活動列表資訊
    loading: false,
    error: null,
  }),
  actions: {
    async createEvent(payload) {
      this.loading = true
      try {
        const res = await axios.post('/event/create', payload)
        this.event = res.data.event
        this.events.push(res.data.event)
        this.error = null
      } catch (e) {
        this.error = e.response?.data?.message || e.message
      } finally {
        this.loading = false
      }
    },
    async fetchEvents() {
      this.loading = true
      try {
        const res = await axios.get('/event/all')
        this.events = res.data  // 假設 API 回傳 array
        this.error = null
      } catch (e) {
        this.error = e.response?.data?.message || e.message
      } finally {
        this.loading = false
      }
    },
    async updateEvent(id, payload) {
      this.loading = true
      try {
        const res = await axios.put(`/event/update/${id}`, payload)
        this.event = res.data
        this.error = null
      } catch (e) {
        this.error = e.response?.data?.message || e.message
      } finally {
        this.loading = false
      }
    },
    async deleteEvent(id) {
      this.loading = true
      try {
        await axios.delete(`/event/delete/${id}`)
        this.event = null
        this.error = null
      } catch (e) {
        this.error = e.response?.data?.message || e.message
      } finally {
        this.loading = false
      }
    },
    async fetchEvent(id) {
      this.loading = true
      try {
        const res = await axios.get(`/event/${id}`)
        this.event = res.data
        this.error = null
      } catch (e) {
        this.error = e.response?.data?.message || e.message
      } finally {
        this.loading = false
      }
    },
    clearEvent() {
      this.event = null
      this.error = null
    }
  }
})
