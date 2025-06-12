import { ref, computed, reactive } from 'vue'

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
   clearError,
   resetOrder,
   resetStats,
   ORDER_STATUS,
   ORDER_STATUS_TEXT,
   PAYMENT_METHOD_TEXT
 }
}