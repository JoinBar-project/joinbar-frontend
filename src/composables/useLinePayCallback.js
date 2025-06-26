import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'

export function useLinePayCallback() {
  const router = useRouter()
  const route = useRoute()
  const isProcessingCallback = ref(false)
  
  const handleLinePayCallback = async () => {
    try {
      const { transactionId, orderId } = route.query
      
      if (transactionId && orderId) {
        console.log('🔄 檢測到 LINE Pay 回調:', { transactionId, orderId })
        isProcessingCallback.value = true
        
        router.replace({
          name: 'PaymentWaiting',
          query: { orderId, transactionId }
        })
        
        return true
      }
      
      const pendingOrder = sessionStorage.getItem('pendingOrder')
      if (pendingOrder) {
        try {
          const orderInfo = JSON.parse(pendingOrder)
          console.log('🔄 檢測到待處理訂單:', orderInfo)
          
          router.replace({
            name: 'PaymentWaiting',
            query: { orderId: orderInfo.orderId }
          })
          
          return true
        } catch (e) {
          console.warn('⚠️ sessionStorage 數據解析失敗:', e)
          sessionStorage.removeItem('pendingOrder')
        }
      }
      
      return false
    } catch (error) {
      console.error('❌ LINE Pay 回調處理失敗:', error)
      return false
    }
  }
  
  const clearPendingOrder = () => {
    sessionStorage.removeItem('pendingOrder')
  }
  
  const setPendingOrder = (orderInfo) => {
    sessionStorage.setItem('pendingOrder', JSON.stringify(orderInfo))
  }
  
  const getPendingOrder = () => {
    try {
      const pendingOrder = sessionStorage.getItem('pendingOrder')
      return pendingOrder ? JSON.parse(pendingOrder) : null
    } catch (e) {
      console.warn('⚠️ 獲取待處理訂單失敗:', e)
      sessionStorage.removeItem('pendingOrder')
      return null
    }
  }
  
  return {
    isProcessingCallback,
    handleLinePayCallback,
    clearPendingOrder,
    setPendingOrder,
    getPendingOrder
  }
}