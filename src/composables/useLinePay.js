import { ref } from 'vue'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

export function useLinePay() {
  const isLoading = ref(false)
  const error = ref('')

  const createLinePayment = async (orderId) => {
    try {
      isLoading.value = true
      error.value = ''

      if (!orderId) {
        throw new Error('訂單 ID 不能為空')
      }

      console.log('🔄 創建 LINE Pay 付款...', orderId)

      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('請先登入')
      }

      const response = await axios.post(
        `${API_BASE_URL}/linepay/create`, 
        { orderId: String(orderId) }, 
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      )

      if (response.data.success) {
        console.log('✅ LINE Pay 付款創建成功:', response.data.data)

        return {
          success: true,
          paymentUrl: response.data.data.paymentUrl,
          transactionId: response.data.data.transactionId,
          orderId: response.data.data.orderId,
          amount: response.data.data.amount
        }
      } else {
        throw new Error(response.data.message || 'LINE Pay 創建失敗')
      }

    } catch (err) {
      console.error('❌ LINE Pay 創建失敗:', err)
      
      let errorMessage = 'LINE Pay 付款創建失敗'
      
      if (err.response) {
        const { status, data } = err.response
        
        switch (status) {
          case 401:
            errorMessage = '登入已過期，請重新登入'
            localStorage.removeItem('access_token')
            localStorage.removeItem('user')
            break
          case 404:
            errorMessage = '找不到訂單，請確認訂單狀態'
            break
          case 400:
            if (data.message?.includes('已付款')) {
              errorMessage = '該訂單已付款，無需重複付款'
            } else if (data.message?.includes('狀態')) {
              errorMessage = '訂單狀態異常，無法進行付款'
            } else {
              errorMessage = data.message || '請求參數錯誤'
            }
            break
          case 429:
            errorMessage = '請求過於頻繁，請稍後再試'
            break
          case 503:
            errorMessage = 'LINE Pay 服務暫時無法使用'
            break
          default:
            errorMessage = data.message || `服務錯誤 (${status})`
        }
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = '請求超時，請檢查網路連線'
      } else {
        errorMessage = err.message || 'LINE Pay 連線失敗'
      }

      error.value = errorMessage
      throw new Error(errorMessage)
    } finally {
      isLoading.value = false
    }
  }

  const redirectToLinePay = (paymentUrl) => {
    if (!paymentUrl) {
      throw new Error('付款網址無效')
    }
    
    console.log('🔄 跳轉到 LINE Pay:', paymentUrl)
    window.location.href = paymentUrl
  }

  const checkPaymentStatus = async (orderId) => {
    try {
      console.log('🔍 檢查 LINE Pay 狀態...', orderId)

      const token = localStorage.getItem('access_token')
      if (!token) {
        throw new Error('請先登入')
      }

      const response = await axios.get(
        `${API_BASE_URL}/linepay/status/${orderId}`, 
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          timeout: 10000
        }
      )

      console.log('✅ 付款狀態檢查成功:', response.data)
      return response.data

    } catch (err) {
      console.error('❌ 付款狀態檢查失敗:', err)
      
      let errorMessage = '無法檢查付款狀態'
      
      if (err.response) {
        const { status, data } = err.response
        
        switch (status) {
          case 401:
            errorMessage = '登入已過期'
            break
          case 404:
            errorMessage = '找不到訂單'
            break
          default:
            errorMessage = data.message || '狀態查詢失敗'
        }
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = '請求超時'
      } else {
        errorMessage = err.message || '網路連線失敗'
      }
      
      throw new Error(errorMessage)
    }
  }

  const clearState = () => {
    error.value = ''
  }

  return {
    isLoading,
    error,
    createLinePayment,
    checkPaymentStatus,
    redirectToLinePay,
    clearState
  }
}