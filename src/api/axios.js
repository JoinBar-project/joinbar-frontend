import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// 建立 Axios 實例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // 重要：讓請求自動帶上 cookies
  timeout: 10000
});

// 請求攔截器
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API 請求: ${config.method.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('請求攔截器錯誤:', error)
    return Promise.reject(error)
  }
);

// 響應攔截器
apiClient.interceptors.response.use(
  (response) => {
    // 成功回應，直接返回
    console.log(`API 回應: ${response.config.method.toUpperCase()} ${response.config.url} - ${response.status}`)
    return response
  },
  async (error) => {
    const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
    const url = error.config?.url || 'unknown-url';
    const status = error.response?.status || 'no-status';
    
    console.error(`API 錯誤: ${method} ${url} - ${status}`)
    
    if (error.response) {
      const { status } = error.response
      
      switch (status) {
        case 401:
          // Token 無效或過期
          console.warn('認證失效，清除登入狀態')
          // 動態導入 store 和 router
          try {
            const { useAuthStore } = await import('./auth')
            const { useRouter } = await import('vue-router')
            const authStore = useAuthStore()
            const router = useRouter()
            // 清除前端狀態
            authStore.clearAuthState()
            router.push('/login')
          } catch (importError) {
            console.error('動態導入失敗:', importError)
            window.location.href = '/login'
          }
          break
        case 403:
          console.warn('權限不足')
          break
        case 404:
          console.warn('資源不存在')
          break
        case 500:
          console.error('伺服器錯誤')
          break
        default:
          console.error(`未處理的錯誤狀態: ${status}`)
      }
    } else if (error.request) {
      // 網路錯誤
      console.error('網路連線錯誤')
    }
    return Promise.reject(error)
  }
)

export default apiClient