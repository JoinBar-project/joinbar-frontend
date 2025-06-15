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

     console.log('🔄 Creating LINE Pay payment...', orderId)

     const token = localStorage.getItem('auth_token')
     if (!token) {
       throw new Error('Please login first')
     }

     const response = await axios.post(
       `${API_BASE_URL}/api/linepay/create`,
       { orderId },
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
       
       console.log('✅ LINE Pay payment created successfully:', {
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
       throw new Error(response.data.message || 'Failed to create LINE Pay payment')
     }

   } catch (err) {
     console.error('❌ LINE Pay creation failed:', err)
     
     let errorMessage = 'Failed to create LINE Pay payment'
     
     if (err.response) {
       const { status, data } = err.response
       
       switch (status) {
         case 401:
           errorMessage = 'Login expired, please login again'
           localStorage.removeItem('auth_token')
           localStorage.removeItem('user_info')
           break
         case 404:
           errorMessage = 'Order not found'
           break
         case 400:
           errorMessage = data.message || 'Invalid order status'
           break
         case 429:
           errorMessage = 'Too many requests, please try again later'
           break
         default:
           errorMessage = data.message || `HTTP ${status} error`
       }
     } else if (err.code === 'ECONNABORTED') {
       errorMessage = 'Request timeout, please check your connection'
     } else {
       errorMessage = err.message || 'Network connection failed'
     }

     error.value = errorMessage
     throw new Error(errorMessage)
   } finally {
     isLoading.value = false
   }
 }

 const checkPaymentStatus = async (orderId) => {
   try {
     console.log('🔍 Checking LINE Pay status...', orderId)

     const token = localStorage.getItem('auth_token')
     if (!token) {
       throw new Error('Please login first')
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

     console.log('✅ Payment status checked successfully:', response.data)
     return response.data

   } catch (err) {
     console.error('❌ Payment status check failed:', err)
     throw new Error('Failed to check payment status')
   }
 }

 const redirectToLinePay = (paymentUrl) => {
   if (!paymentUrl) {
     throw new Error('Invalid payment URL')
   }

   console.log('🔄 Redirecting to LINE Pay page...', paymentUrl)
   
   const paymentWindow = window.open(
     paymentUrl,
     'linePayWindow',
     'width=400,height=600,scrollbars=yes,resizable=yes'
   )

   if (!paymentWindow) {
     console.log('Popup blocked, redirecting in current window')
     window.location.href = paymentUrl
   }

   return paymentWindow
 }

 const clearState = () => {
   error.value = ''
   paymentUrl.value = ''
   transactionId.value = ''
 }

 return {
   isLoading,
   error,
   paymentUrl,
   transactionId,
   createLinePayment,
   checkPaymentStatus,
   redirectToLinePay,
   clearState
 }
}