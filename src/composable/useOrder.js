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

 const validateOrderData = (orderData) => {
   const required = ['items', 'customerName', 'customerPhone', 'customerEmail', 'paymentMethod']
   
   for (const field of required) {
     if (!orderData[field]) {
       throw new Error(`缺少必要欄位: ${field}`)
     }
   }

   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
   if (!emailRegex.test(orderData.customerEmail)) {
     throw new Error('電子郵件格式不正確')
   }

   const phoneRegex = /^09\d{8}$|^0\d{1,2}-?\d{6,8}$/
   if (!phoneRegex.test(orderData.customerPhone.replace(/[-\s]/g, ''))) {
     console.warn('電話格式可能不正確:', orderData.customerPhone)
   }

   if (orderData.customerName.trim().length < 2) {
     throw new Error('姓名至少需要2個字元')
   }

   if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
     throw new Error('訂單必須包含至少一個商品')
   }

   if (orderData.items.length > 10) {
     throw new Error('單次訂單最多10個活動')
   }

   for (const item of orderData.items) {
     if (!item.eventId) {
       throw new Error('每個商品都必須有 eventId')
     }
     
     item.eventId = String(item.eventId)
     
     if (item.quantity && (isNaN(item.quantity) || item.quantity <= 0)) {
       throw new Error('商品數量必須是正整數')
     }
     
     item.quantity = item.quantity || 1
   }

   console.log(`✅ 訂單數據驗證通過`)
   return true
 }

 const validateItemId = (id) => {
   if (!id) {
     throw new Error('商品 ID 不能為空')
   }
   return String(id)
 }

 const validateOrderId = (orderId) => {
   if (!orderId) {
     throw new Error('訂單 ID 不能為空')
   }
   return String(orderId)
 }

 const createOrder = async (orderData) => {
   try {
     isLoading.value = true
     error.value = ''

     validateOrderData(orderData)
     
     const response = await request('/api/orders/create', {
       method: 'POST',
       body: JSON.stringify(orderData)
     })

     if (response.order) {
       currentOrder.value = response.order
       
       stats.totalOrders++
       stats.totalAmount += parseFloat(response.order.totalAmount || 0)
       if (response.order.status === 'pending') {
         stats.pendingCount++
       }
     }

     console.log('✅ 訂單創建成功:', response.order?.orderNumber)
     return response
   } catch (err) {
     error.value = err.message
     throw err
   } finally {
     isLoading.value = false
   }
 }

 const getOrderDetails = async (orderId) => {
   try {
     isLoading.value = true
     error.value = ''

     const processedOrderId = validateOrderId(orderId)
     const response = await request(`/api/orders/${processedOrderId}/details`)
     
     if (response.order) {
       currentOrder.value = response.order
     }

     console.log('✅ 訂單詳情載入成功:', response.order?.orderNumber)
     return response
   } catch (err) {
     error.value = err.message
     throw err
   } finally {
     isLoading.value = false
   }
 }

 const confirmPayment = async (orderId, paymentData) => {
   try {
     isLoading.value = true
     error.value = ''

     if (!paymentData || !paymentData.paymentId) {
       throw new Error('付款數據不完整')
     }
     
     console.log(`🔄 確認付款，更新訂單狀態...`)
     const processedOrderId = validateOrderId(orderId)
     
     const response = await request(`/api/orders/confirm-payment/${processedOrderId}`, {
       method: 'PUT',
       body: JSON.stringify({
         paymentId: paymentData.paymentId,
         paymentMethod: paymentData.paymentMethod
       })
     })

     if (currentOrder.value && currentOrder.value.orderId === processedOrderId) {
       currentOrder.value.status = 'paid'
       currentOrder.value.paymentId = paymentData.paymentId
       currentOrder.value.paymentMethod = paymentData.paymentMethod
       currentOrder.value.paidAt = new Date().toISOString()
     }

     stats.pendingCount = Math.max(0, stats.pendingCount - 1)
     stats.completedCount++

     console.log('✅ 付款確認成功:', response.orderId)
     return response
   } catch (err) {
     error.value = err.message
     throw err
   } finally {
     isLoading.value = false
   }
 }

 const cancelOrder = async (orderId, reason = '') => {
   try {
     isLoading.value = true
     error.value = ''

     const processedOrderId = validateOrderId(orderId)
     const response = await request(`/api/orders/${processedOrderId}`, {
       method: 'DELETE',
       body: JSON.stringify({ reason })
     })

     if (currentOrder.value && currentOrder.value.orderId === processedOrderId) {
       currentOrder.value.status = 'cancelled'
     }

     console.log('✅ 訂單取消成功:', response.orderId)
     return response
   } catch (err) {
     error.value = err.message
     throw err
   } finally {
     isLoading.value = false
   }
 }

 const simulatePayment = async (paymentData) => {
   const { paymentMethod, orderData } = paymentData
   
   if (!paymentMethod || !orderData) {
     throw new Error('付款方式和訂單數據不能為空')
   }
   
   console.log(`💳 開始模擬 ${PAYMENT_METHOD_TEXT[paymentMethod]} 付款...`)
   
   const processingTime = paymentMethod === 'linepay' ? 1500 : 2000
   await new Promise(resolve => setTimeout(resolve, processingTime))
   
   const result = {
     success: true,
     paymentId: `${paymentMethod.toUpperCase()}_${Date.now()}`,
     paymentMethod,
     orderId: String(orderData.orderId),
     timestamp: new Date().toISOString()
   }
   
   console.log(`✅ 付款模擬完成:`, result)
   return result
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
   createOrder,
   getOrderDetails,
   confirmPayment,
   cancelOrder,
   simulatePayment,
   validateOrderData,
   validateItemId,
   validateOrderId,
   clearError,
   resetOrder,
   resetStats,
   clearAuth,
   ORDER_STATUS,
   ORDER_STATUS_TEXT,
   PAYMENT_METHOD_TEXT
 }
}