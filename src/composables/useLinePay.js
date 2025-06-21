import { ref } from 'vue'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

export function useLinePay() {
 const isLoading = ref(false)
 const error = ref('')
 const paymentUrl = ref('')
 const transactionId = ref('')

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
       `${API_BASE_URL}/api/linepay/create`,
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
       paymentUrl.value = response.data.data.paymentUrl
       transactionId.value = response.data.data.transactionId
       
       if (!paymentUrl.value || !transactionId.value) {
         throw new Error('LINE Pay 返回數據不完整')
       }

       console.log('✅ LINE Pay 付款創建成功:', {
         transactionId: transactionId.value,
         paymentUrl: paymentUrl.value
       })

       return {
         success: true,
         paymentUrl: paymentUrl.value,
         transactionId: transactionId.value,
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
     } else if (err.message?.includes('網路')) {
       errorMessage = '網路連線失敗'
     } else {
       errorMessage = err.message || 'LINE Pay 連線失敗'
     }

     error.value = errorMessage
     throw new Error(errorMessage)
   } finally {
     isLoading.value = false
   }
 }

 const checkPaymentStatus = async (orderId) => {
   try {
     console.log('🔍 檢查 LINE Pay 狀態...', orderId)

     const token = localStorage.getItem('access_token')
     if (!token) {
       throw new Error('請先登入')
     }

     const response = await axios.get(
       `${API_BASE_URL}/api/linepay/status/${orderId}`,
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

 const redirectToLinePay = (paymentUrl, onCloseCallback = null) => {
  localStorage.removeItem('linepay-result');
  
  const paymentWindow = window.open(paymentUrl, 'linePayWindow', 'width=400,height=600');
  
  if (!paymentWindow) {
    window.location.href = paymentUrl;
    return;
  }
  
  let isProcessed = false;
  
  const checkResult = setInterval(() => {
    const result = localStorage.getItem('linepay-result');
    
    if (result && !isProcessed) {
      isProcessed = true;
      const data = JSON.parse(result);
      
      localStorage.removeItem('linepay-result');
      
      paymentWindow.close();
      
      if (data.success) {
        window.dispatchEvent(new CustomEvent('linepay-success', { detail: data }));
      } else {
        window.dispatchEvent(new CustomEvent('linepay-error', { detail: data }));
      }
      
      clearInterval(checkResult);
      clearInterval(checkClosed);
    }
  }, 1000);
  
  const checkClosed = setInterval(() => {
    if (paymentWindow.closed) {
      clearInterval(checkResult);
      clearInterval(checkClosed);
      
      if (!isProcessed && onCloseCallback) {
        onCloseCallback();
      }
    }
  }, 1000);
  
  return paymentWindow;
};

 const clearState = () => {
   error.value = ''
   paymentUrl.value = ''
   transactionId.value = ''
 }

 const checkDetailedPaymentStatus = async (orderId) => {
  try {
    console.log('🔍 檢查詳細付款狀態...', orderId)

    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('請先登入')
    }

    const response = await axios.get(
      `${API_BASE_URL}/api/linepay/status/${orderId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 10000
      }
    )

    console.log('✅ 詳細付款狀態檢查成功:', response.data)
    
    return {
      success: true,
      orderStatus: response.data.status,
      orderInfo: {
        orderId: response.data.orderId,
        orderNumber: response.data.orderNumber,
        amount: response.data.amount,
        paymentMethod: response.data.paymentMethod,
        paidAt: response.data.paidAt
      },
      linePayInfo: response.data.linePayStatus || null
    }

  } catch (err) {
    console.error('❌ 詳細付款狀態檢查失敗:', err)
    
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
        case 403:
          errorMessage = '無權限查看此訂單'
          break
        default:
          errorMessage = data.message || '狀態查詢失敗'
      }
    }
    
    throw new Error(errorMessage)
  }
}

const formatPaymentStatusDisplay = (statusData) => {
  let display = {
    title: '',
    message: '',
    color: '',
    icon: ''
  }

  if (!statusData.success) {
    display.title = '狀態檢查失敗'
    display.message = '無法獲取付款狀態'
    display.color = 'red'
    display.icon = '❌'
    return display
  }

  const { orderStatus, linePayInfo } = statusData

  switch (orderStatus) {
    case 'pending':
      display.title = '待付款'
      display.message = '訂單已建立，等待付款'
      display.color = 'orange'
      display.icon = '⏳'
      break
    case 'confirmed':
      display.title = '已確認'
      display.message = '付款完成，訂單已確認'
      display.color = 'green'
      display.icon = '✅'
      break
    case 'cancelled':
      display.title = '已取消'
      display.message = '訂單已取消'
      display.color = 'gray'
      display.icon = '🚫'
      break
    default:
      display.title = orderStatus
      display.message = '未知狀態'
      display.color = 'gray'
      display.icon = '❓'
  }

  if (linePayInfo) {
    display.message += `\n\nLINE Pay: ${linePayInfo.isPaid ? '✅ 已付款' : '❌ 未付款'}`
    if (linePayInfo.transactionId) {
      display.message += `\n交易號: ${linePayInfo.transactionId}`
    }
  }

  return display
}

 return {
   isLoading,
   error,
   paymentUrl,
   transactionId,
   createLinePayment,
   checkPaymentStatus,
   redirectToLinePay,
   clearState,
   checkDetailedPaymentStatus, 
   formatPaymentStatusDisplay
}
}