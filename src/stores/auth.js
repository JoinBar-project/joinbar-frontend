// stores/auth.js
import { defineStore } from 'pinia'
import axios from 'axios'
import Swal from 'sweetalert2'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    accessToken: null,
    refreshToken: null,
    isLoading: false,
    isEmailLoading: false,
    isLineLoading: false,
    errorMessage: ''
  }),

  getters: {
    isAuthenticated: (state) => !!state.accessToken,
    currentUser: (state) => state.user
  },

  actions: {
    // 初始化 - 從 localStorage 讀取 token
    init() {
      const accessToken = localStorage.getItem('access_token')
      const refreshToken = localStorage.getItem('refresh_token')
      const user = localStorage.getItem('user')

      if (accessToken) {
        this.accessToken = accessToken
        this.refreshToken = refreshToken
        this.user = user ? JSON.parse(user) : null
      }
    },

    // 清除錯誤訊息
    clearError() {
      this.errorMessage = ''
    },

    // Email 登入
    async emailLogin(email, password) {
      this.clearError()
      
      if (!email || !password) {
        await Swal.fire({
          title: '請填寫完整資訊',
          text: '請輸入電子郵件和密碼',
          icon: 'warning',
          confirmButtonText: '確認'
        })
        return false
      }

      this.isEmailLoading = true
      this.isLoading = true

      const API_BASE_URL = 'http://localhost:3000/api'
      axios.defaults.withCredentials = true

      try {
        const resp = await axios.post(`${API_BASE_URL}/auth/login`, {
          email,
          password
        })

        console.log('登入成功:', resp.data)

        // 儲存 token 和用戶資訊
        this.accessToken = resp.data.accessToken
        this.refreshToken = resp.data.refreshToken
        this.user = resp.data.user

        // 同步到 localStorage
        localStorage.setItem('access_token', this.accessToken)
        localStorage.setItem('refresh_token', this.refreshToken)
        localStorage.setItem('user', JSON.stringify(this.user))

        await Swal.fire({
          title: '登入成功!',
          icon: 'success',
          confirmButtonText: '開始使用'
        })

        return true

      } catch (err) {
        console.error('登入失敗:', err)

        if (err.response) {
          this.errorMessage = err.response.data.error || '登入失敗'
          
          let title = '登入失敗'
          if (err.response.status === 401) {
            title = '帳號或密碼錯誤'
            this.errorMessage = '請檢查您的電子郵件和密碼是否正確'
          } else if (err.response.status === 500) {
            title = '伺服器發生錯誤'
          }

          await Swal.fire({
            title: title,
            text: this.errorMessage,
            icon: 'error',
            confirmButtonText: '確認'
          })

        } else if (err.request) {
          this.errorMessage = '網路連線失敗，請檢查網路狀態'
          await Swal.fire({
            title: '網路發生錯誤!',
            text: this.errorMessage,
            icon: 'error',
            confirmButtonText: '確認'
          })

        } else {
          this.errorMessage = '發生未知錯誤，請稍後再試'
          await Swal.fire({
            title: '發生未知錯誤!',
            text: this.errorMessage,
            icon: 'error',
            confirmButtonText: '確認'
          })
        }

        return false

      } finally {
        this.isEmailLoading = false
        this.isLoading = false
      }
    },

    // LINE 登入
    async lineLogin() {
      this.isLineLoading = true
      this.isLoading = true
      this.errorMessage = ''

      const API_BASE_URL = 'http://localhost:3000/api'

      try {
        const resp = await axios.get(`${API_BASE_URL}/auth/line/url`)
        console.log('LINE 授權 URL 取得成功:', resp.data)

        if (resp.data.authUrl) {
          window.location.href = resp.data.authUrl
          return true
        } else {
          throw new Error('無法取得 LINE 授權連結')
        }

      } catch (err) {
        console.error('LINE 登入失敗:', err)

        if (err.response) {
          this.errorMessage = err.response.data.error || 'LINE 登入失敗'
        } else if (err.request) {
          this.errorMessage = '網路連線失敗，請檢查網路狀態'
        } else {
          this.errorMessage = 'LINE 登入發生錯誤，請稍後再試'
        }

        await Swal.fire({
          title: 'LINE 登入失敗',
          text: this.errorMessage,
          icon: 'error',
          confirmButtonText: '確認'
        })

        return false

      } finally {
        this.isLineLoading = false
        this.isLoading = false
      }
    },

    // 檢查 LINE 登入回調
    async checkLineCallback() {
      const urlParams = new URLSearchParams(window.location.search)
      const success = urlParams.get('success')
      const error = urlParams.get('error')
      
      if (success === 'true') {
        await Swal.fire({
          title: 'LINE 登入成功!',
          text: '歡迎使用 LINE 登入',
          icon: 'success',
          confirmButtonText: '開始使用'
        })
        
        window.history.replaceState({}, document.title, window.location.pathname)
        return { success: true, redirect: '/home' }
        
      } else if (error) {
        const errorMsg = decodeURIComponent(error)
        this.errorMessage = errorMsg
        
        await Swal.fire({
          title: 'LINE 登入失敗',
          text: errorMsg,
          icon: 'error',
          confirmButtonText: '確認'
        })
        
        window.history.replaceState({}, document.title, window.location.pathname)
        return { success: false }
      }
      
      return null
    },
  }
})