// composables/useOrder.js
import { ref, computed, reactive } from 'vue'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

export const ORDER_STATUS = {
 PENDING: 'pending',
 PAID: 'paid',
 CONFIRMED: 'confirmed',
 CANCELLED: 'cancelled',
 REFUNDED: 'refunded',
 EXPIRED: 'expired'
}

export const ORDER_STATUS_TEXT = {
 [ORDER_STATUS.PENDING]: '待付款',
 [ORDER_STATUS.PAID]: '已付款',
 [ORDER_STATUS.CONFIRMED]: '已確認',
 [ORDER_STATUS.CANCELLED]: '已取消',
 [ORDER_STATUS.REFUNDED]: '已退款',
 [ORDER_STATUS.EXPIRED]: '已過期'
}

export const PAYMENT_METHOD_TEXT = {
 'linepay': 'LINE Pay',
 'creditcard': '信用卡'
}

export function useOrder() {
 const isLoading = ref(false)
 const error = ref('')
 const currentOrder = ref(null)
 const orderHistory = ref([])
 
 const stats = reactive({
   totalOrders: 0,
   totalAmount: 0,
   pendingCount: 0,
   completedCount: 0
 })

 const hasActiveOrder = computed(() => 
   currentOrder.value && 
   ['pending', 'paid', 'confirmed'].includes(currentOrder.value.status)
 )

 const formattedTotalAmount = computed(() => {
   if (!stats.totalAmount) return '0'
   return stats.totalAmount.toLocaleString()
 })

 const clearAuth = () => {
   localStorage.removeItem('auth_token')
   localStorage.removeItem('user_info')
 }

 const request = async (endpoint, options = {}) => {
   const url = `${API_BASE_URL}${endpoint}`
   const token = localStorage.getItem('auth_token')
   
   const config = {
     headers: {
       'Content-Type': 'application/json',
       ...(token && { Authorization: `Bearer ${token}` }),
       ...options.headers,
     },
     ...options
   }
   try {
     console.log(`🔄 API 請求: ${config.method || 'GET'} ${url}`)
     
     const response = await fetch(url, config)
     
     if (!response.ok) {
       const errorData = await response.json().catch(() => ({ message: '請求失敗' }))
       
       if (response.status === 401) {
         clearAuth()
         throw new Error('登入已過期，請重新登入')
       }
       
       const errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`
       throw new Error(errorMessage)
     }
     const responseData = await response.json()
     console.log(`✅ API 響應:`, responseData)
     
     return responseData
     
   } catch (err) {
     console.error(`❌ API 請求失敗 [${endpoint}]:`, err)
     throw err
   }
 }

 const clearError = () => {
   error.value = ''
 }

 const resetOrder = () => {
   currentOrder.value = null
   error.value = ''
 }

 const resetStats = () => {
   stats.totalOrders = 0
   stats.totalAmount = 0
   stats.pendingCount = 0
   stats.completedCount = 0
 }

 return {
   isLoading,
   error,
   currentOrder,
   orderHistory,
   stats,
   hasActiveOrder,
   formattedTotalAmount,
   request,
   clearError,
   resetOrder,
   resetStats,
   clearAuth,
   ORDER_STATUS,
   ORDER_STATUS_TEXT,
   PAYMENT_METHOD_TEXT
 }
}