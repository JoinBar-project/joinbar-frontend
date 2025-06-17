import { ref, computed, reactive } from 'vue'
import axios from 'axios'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

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

const apiClient = axios.create({
 baseURL: API_BASE_URL,
 timeout: 10000,
 headers: {
   'Content-Type': 'application/json'
 }
})

apiClient.interceptors.request.use(
 (config) => {
   const token = localStorage.getItem('auth_token')
   if (token) {
     config.headers.Authorization = `Bearer ${token}`
   }
   
   console.log(`🔄 API 請求: ${config.method?.toUpperCase()} ${config.url}`)
   return config
 },
 (error) => {
   console.error('❌ 請求攔截器錯誤:', error)
   return Promise.reject(error)
 }
)

apiClient.interceptors.response.use(
 (response) => {
   console.log(`✅ API 響應:`, response.data)
   return response
 },
 (error) => {
   console.error(`❌ API 響應錯誤:`, error.response?.data || error.message)
   
   if (error.response?.status === 401) {
     localStorage.removeItem('auth_token')
     localStorage.removeItem('user_info')
   }
   
   return Promise.reject(error)
 }
)

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

const handleApiError = (error, defaultMessage = '請求失敗') => {
  let errorMessage = defaultMessage
  
  if (error.response) {
    const { status, data } = error.response
    
    switch (status) {
      case 401:
        errorMessage = '登入已過期，請重新登入'
        clearAuth()
        break
      case 403:
        errorMessage = '權限不足'
        break
      case 404:
        errorMessage = '找不到請求的資源'
        break
      case 409:
        errorMessage = data?.message || '請求衝突'
        break
      case 422:
        errorMessage = data?.message || '資料驗證失敗'
        break
      case 500:
        errorMessage = '伺服器內部錯誤'
        break
      default:
        errorMessage = data?.message || `HTTP ${status}: ${error.response.statusText}`
    }
  } else if (error.request) {
    errorMessage = '網路連線失敗，請檢查網路狀態'
  } else {
    errorMessage = error.message || defaultMessage
  }
  
  return errorMessage
}

const validateOrderData = (orderData) => {
  const required = ['items', 'paymentMethod']
  
  for (const field of required) {
    if (!orderData[field]) {
      throw new Error(`缺少必要欄位: ${field}`)
    }
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
    
    const response = await apiClient.post('/api/orders/create', orderData)

    if (response.data.order) {
      currentOrder.value = response.data.order
      
      stats.totalOrders++
      stats.totalAmount += parseFloat(response.data.order.totalAmount || 0)
      if (response.data.order.status === 'pending') {
        stats.pendingCount++
      }
    }

    console.log('✅ 訂單創建成功:', response.data.order?.orderNumber)
    return response.data
  } catch (err) {
    const errorMessage = handleApiError(err, '創建訂單失敗')
    error.value = errorMessage
    throw new Error(errorMessage)
  } finally {
    isLoading.value = false
  }
}

const getOrderDetails = async (orderId) => {
  try {
    isLoading.value = true
    error.value = ''

    const processedOrderId = validateOrderId(orderId)
    const response = await apiClient.get(`/api/orders/${processedOrderId}/details`)
    
    if (response.data.order) {
      currentOrder.value = response.data.order
    }

    console.log('✅ 訂單詳情載入成功:', response.data.order?.orderNumber)
    return response.data
  } catch (err) {
    const errorMessage = handleApiError(err, '載入訂單詳情失敗')
    error.value = errorMessage
    throw new Error(errorMessage)
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
    
    const response = await apiClient.put(`/api/orders/confirm-payment/${processedOrderId}`, {
      paymentId: paymentData.paymentId,
      paymentMethod: paymentData.paymentMethod
    })

    if (currentOrder.value && currentOrder.value.orderId === processedOrderId) {
      currentOrder.value.status = 'paid'
      currentOrder.value.paymentId = paymentData.paymentId
      currentOrder.value.paymentMethod = paymentData.paymentMethod
      currentOrder.value.paidAt = dayjs().tz('Asia/Taipei').toISOString()
    }

    stats.pendingCount = Math.max(0, stats.pendingCount - 1)
    stats.completedCount++

    console.log('✅ 付款確認成功:', response.data.orderId)
    return response.data
  } catch (err) {
    const errorMessage = handleApiError(err, '付款確認失敗')
    error.value = errorMessage
    throw new Error(errorMessage)
  } finally {
    isLoading.value = false
  }
}

const cancelOrder = async (orderId, reason = '') => {
  try {
    isLoading.value = true
    error.value = ''

    const processedOrderId = validateOrderId(orderId)
    const response = await apiClient.delete(`/api/orders/${processedOrderId}`, {
      data: { reason }
    })

    if (currentOrder.value && currentOrder.value.orderId === processedOrderId) {
      currentOrder.value.status = 'cancelled'
    }

    console.log('✅ 訂單取消成功:', response.data.orderId)
    return response.data
  } catch (err) {
    const errorMessage = handleApiError(err, '取消訂單失敗')
    error.value = errorMessage
    throw new Error(errorMessage)
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
    timestamp: dayjs().tz('Asia/Taipei').toISOString()
  }
  
  console.log(`✅ 付款模擬完成:`, result)
  return result
}

const getOrderHistory = async () => {
  try {
    isLoading.value = true
    error.value = ''

    const response = await apiClient.get('/api/orders/history')
    
    if (response.data.orders) {
      orderHistory.value = response.data.orders

      stats.totalOrders = response.data.orders.length
      stats.totalAmount = response.data.orders.reduce((sum, order) => sum + parseFloat(order.totalAmount || 0), 0)
      stats.pendingCount = response.data.orders.filter(order => order.status === 'pending').length
      stats.completedCount = response.data.orders.filter(order => ['paid', 'confirmed'].includes(order.status)).length
    }

    return response.data
  } catch (err) {
    const errorMessage = handleApiError(err, '載入訂單歷史失敗')
    error.value = errorMessage
    throw new Error(errorMessage)
  } finally {
    isLoading.value = false
  }
}

const formatAmount = (amount) => {
  if (!amount) return '0'
  
  let numericAmount
  if (typeof amount === 'bigint') {
    numericAmount = Number(amount)
  } else if (typeof amount === 'string') {
    numericAmount = parseFloat(amount)
  } else {
    numericAmount = amount
  }
  
  return numericAmount.toLocaleString()
}

const formatDateTime = (dateString) => {
  if (!dateString) return '-'
  return dayjs(dateString).tz('Asia/Taipei').format('YYYY/MM/DD HH:mm')
}

const formatEventDateTime = (dateString) => {
  if (!dateString) return '-'
  return dayjs(dateString).tz('Asia/Taipei').format('MM/DD HH:mm')
}

const getStatusText = (status) => {
  return ORDER_STATUS_TEXT[status] || status
}

const getPaymentMethodText = (method) => {
  return PAYMENT_METHOD_TEXT[method] || method
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
  createOrder,
  getOrderDetails,
  confirmPayment,
  cancelOrder,
  simulatePayment,
  getOrderHistory,
  validateOrderData,
  validateOrderId,
  formatAmount,
  formatDateTime,
  formatEventDateTime,
  getStatusText,
  getPaymentMethodText,
  clearError,
  resetOrder,
  resetStats,
  clearAuth,
  handleApiError,
  ORDER_STATUS,
  ORDER_STATUS_TEXT,
  PAYMENT_METHOD_TEXT,
  apiClient
}
}