<template>
  <div class="payment-waiting-container">
    <div class="waiting-content">
      <div v-if="isChecking" class="checking-section">
        <div class="spinner-large"></div>
        <h2>正在確認付款狀態</h2>
        <p class="waiting-description">
          請稍候，我們正在確認您的付款...
        </p>
        <div class="progress-info">
          <p>檢查次數: {{ currentAttempt }}/{{ maxAttempts }}</p>
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: `${(currentAttempt / maxAttempts) * 100}%` }"
            ></div>
          </div>
        </div>
      </div>

      <div v-else-if="paymentStatus === 'success'" class="success-section">
        <div class="success-icon">✅</div>
        <h2>付款確認成功！</h2>
        <p>您的訂單已確認，正在跳轉到訂單詳情...</p>
        <div class="order-info" v-if="orderData">
          <p><strong>訂單編號：</strong>{{ orderData.orderNumber }}</p>
          <p><strong>付款金額：</strong>${{ formatAmount(orderData.totalAmount) }}</p>
        </div>
      </div>

      <div v-else-if="paymentStatus === 'failed'" class="failed-section">
        <div class="failed-icon">❌</div>
        <h2>付款確認失敗</h2>
        <p class="error-message">{{ errorMessage }}</p>
        <div class="action-buttons">
          <button @click="retryCheck" class="btn-retry" :disabled="isChecking">
            重新檢查
          </button>
          <button @click="goToPayment" class="btn-back">
            返回付款頁面
          </button>
        </div>
      </div>

      <div v-else-if="paymentStatus === 'timeout'" class="timeout-section">
        <div class="timeout-icon">⏰</div>
        <h2>付款狀態確認超時</h2>
        <p>請稍後查看訂單狀態，或重新檢查。</p>
        <div class="action-buttons">
          <button @click="retryCheck" class="btn-retry" :disabled="isChecking">
            重新檢查
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrder } from '@/composable/useOrder'

const route = useRoute()
const router = useRouter()
const { getOrderDetails, formatAmount } = useOrder()

const isChecking = ref(true)
const paymentStatus = ref('checking')
const errorMessage = ref('')
const orderData = ref(null)
const currentAttempt = ref(0)
const maxAttempts = ref(15)
const checkInterval = ref(null)

onMounted(async () => {
  const orderId = route.query.orderId
  
  console.log('🔄 PaymentWaiting 啟動:', { orderId })
  
  if (!orderId) {
    paymentStatus.value = 'failed'
    errorMessage.value = '缺少訂單 ID'
    isChecking.value = false
    return
  }

  await startPaymentCheck(orderId)
})

onUnmounted(() => {
  if (checkInterval.value) {
    clearInterval(checkInterval.value)
  }
})

const startPaymentCheck = async (orderId) => {
  try {
    isChecking.value = true
    paymentStatus.value = 'checking'
    currentAttempt.value = 0
    
    const success = await checkOrderStatus(orderId)
    if (success) return
    
    checkInterval.value = setInterval(async () => {
      currentAttempt.value++
      console.log(`🔄 第 ${currentAttempt.value} 次檢查...`)
      
      const success = await checkOrderStatus(orderId)
      
      if (success || currentAttempt.value >= maxAttempts.value) {
        clearInterval(checkInterval.value)
        
        if (!success) {
          paymentStatus.value = 'timeout'
          isChecking.value = false
        }
      }
    }, 3000)
    
  } catch (error) {
    console.error('❌ 付款檢查失敗:', error)
    paymentStatus.value = 'failed'
    errorMessage.value = error.message || '系統錯誤'
    isChecking.value = false
  }
}

const checkOrderStatus = async (orderId) => {
  try {
    const response = await getOrderDetails(orderId)
    const order = response.order
    
    console.log(`📊 訂單狀態: ${order.status}`)
    
    if (['confirmed', 'paid'].includes(order.status)) {
      console.log('✅ 付款確認成功！')
      paymentStatus.value = 'success'
      orderData.value = order
      isChecking.value = false
      
      setTimeout(() => {
        console.log('🔄 跳轉到訂單成功頁面...')
        router.replace({
          name: 'OrderSuccess',
          params: { orderNumber: order.orderNumber },
          query: { orderId: order.id || order.orderId }
        })
      }, 1500)
      
      return true
    }
    
    if (['cancelled', 'expired', 'refunded'].includes(order.status)) {
      paymentStatus.value = 'failed'
      errorMessage.value = `訂單${order.status === 'cancelled' ? '已取消' : order.status === 'expired' ? '已過期' : '已退款'}`
      isChecking.value = false
      return true
    }
    
    return false
    
  } catch (error) {
    console.error('❌ 檢查訂單狀態失敗:', error)
    
    if (currentAttempt.value < 5) {
      return false
    }
    
    paymentStatus.value = 'failed'
    errorMessage.value = '無法獲取訂單狀態'
    isChecking.value = false
    return true
  }
}

const retryCheck = async () => {
  const orderId = route.query.orderId
  if (orderId) {
    currentAttempt.value = 0
    if (checkInterval.value) {
      clearInterval(checkInterval.value)
    }
    await startPaymentCheck(orderId)
  }
}

const goToPayment = () => {
  router.push('/payment')
}
</script>

<style scoped>
.payment-waiting-container {
  max-width: 600px;
  margin: 48px auto;
  padding: 40px;
  font-size: 15px;
}

.waiting-content {
  background: white;
  border-radius: 16px;
  padding: 48px;
  text-align: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.checking-section h2,
.success-section h2,
.failed-section h2,
.timeout-section h2 {
  margin: 24px 0 16px 0;
  font-size: 24px;
  font-weight: 600;
}

.spinner-large {
  width: 48px;
  height: 48px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #dc2626;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 24px auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.waiting-description {
  color: #6b7280;
  font-size: 16px;
  margin-bottom: 32px;
}

.progress-info {
  margin-top: 24px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 8px;
}

.progress-fill {
  height: 100%;
  background: #dc2626;
  transition: width 0.3s ease;
}

.success-icon,
.failed-icon,
.timeout-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.order-info {
  background: #f8fafc;
  padding: 16px;
  border-radius: 8px;
  margin: 24px 0;
  text-align: left;
}

.order-info p {
  margin: 8px 0;
  font-size: 14px;
}

.action-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 24px;
}

.btn-retry,
.btn-back {
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-retry {
  background: #059669;
  color: white;
}

.btn-retry:hover:not(:disabled) {
  background: #047857;
}

.btn-retry:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

.btn-back {
  background: #6b7280;
  color: white;
}

.btn-back:hover {
  background: #4b5563;
}

.error-message {
  color: #dc2626;
  font-weight: 500;
  margin: 16px 0;
}

@media (max-width: 768px) {
  .payment-waiting-container {
    margin: 24px 16px;
    padding: 20px;
  }
  
  .waiting-content {
    padding: 32px 24px;
  }
  
  .action-buttons {
    flex-direction: column;
  }
}
</style>