<template>
  <div class="payment-waiting-container">
    <div class="waiting-content">
      <!-- Loading 狀態 -->
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

      <!-- 成功狀態 -->
      <div v-else-if="paymentStatus === 'success'" class="success-section">
        <div class="success-icon">✅</div>
        <h2>付款確認成功！</h2>
        <p>您的訂單已確認，感謝您的購買</p>
        <div class="order-info" v-if="orderData">
          <p><strong>訂單編號：</strong>{{ orderData.orderNumber }}</p>
          <p><strong>付款金額：</strong>${{ formatAmount(orderData.totalAmount) }}</p>
        </div>
        <button @click="goToOrderSuccess" class="btn-success">
          查看訂單詳情
        </button>
      </div>

      <!-- 失敗狀態 -->
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
          <button @click="contactSupport" class="btn-support">
            聯繫客服
          </button>
        </div>
      </div>

      <!-- 超時狀態 -->
      <div v-else-if="paymentStatus === 'timeout'" class="timeout-section">
        <div class="timeout-icon">⏰</div>
        <h2>付款狀態確認超時</h2>
        <p>
          我們無法立即確認您的付款狀態，但這不代表付款失敗。
          <br>
          請稍後查看訂單狀態，或聯繫客服協助處理。
        </p>
        <div class="action-buttons">
          <button @click="goToOrders" class="btn-orders">
            查看我的訂單
          </button>
          <button @click="retryCheck" class="btn-retry" :disabled="isChecking">
            重新檢查
          </button>
        </div>
      </div>
    </div>

    <!-- 說明資訊 -->
    <div class="info-section">
      <h3>付款說明</h3>
      <ul>
        <li>付款完成後，系統通常會在 1-3 分鐘內確認</li>
        <li>如果長時間未確認，請不要重複付款</li>
        <li>遇到問題可以聯繫客服協助處理</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrder } from '@/composables/useOrder'

const route = useRoute()
const router = useRouter()
const { pollPaymentStatus, formatAmount } = useOrder()  // 移除 getOrderDetails

const isChecking = ref(true)
const paymentStatus = ref('checking')
const errorMessage = ref('')
const orderData = ref(null)
const currentAttempt = ref(0)
const maxAttempts = ref(30)

let pollInterval = null

onMounted(async () => {
  const orderId = route.query.orderId
  
  if (!orderId) {
    paymentStatus.value = 'failed'
    errorMessage.value = '缺少訂單 ID'
    isChecking.value = false
    return
  }

  await startPaymentCheck(orderId)
})

onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval)
  }
})

const startPaymentCheck = async (orderId) => {
  try {
    isChecking.value = true
    paymentStatus.value = 'checking'
    
    // 使用 skipLoading=true 避免觸發 useOrder 的 loading 狀態
    const result = await pollPaymentStatus(orderId, maxAttempts.value, 2000, true)
    
    if (result.success) {
      paymentStatus.value = 'success'
      orderData.value = result.order
    } else if (result.status === 'timeout') {
      paymentStatus.value = 'timeout'
    } else {
      paymentStatus.value = 'failed'
      errorMessage.value = result.message || '付款確認失敗'
    }
    
    currentAttempt.value = result.attempts || 0
    
  } catch (error) {
    console.error('Payment check failed:', error)
    paymentStatus.value = 'failed'
    errorMessage.value = error.message || '系統錯誤'
  } finally {
    isChecking.value = false
  }
}

const retryCheck = async () => {
  const orderId = route.query.orderId
  if (orderId) {
    currentAttempt.value = 0
    await startPaymentCheck(orderId)
  }
}

const goToOrderSuccess = () => {
  if (orderData.value) {
    router.push(`/order-success/${orderData.value.orderNumber}?orderId=${orderData.value.id}`)
  }
}

const goToPayment = () => {
  router.push('/payment')
}

const goToOrders = () => {
  router.push('/member/orders')
}

const contactSupport = () => {
  alert('客服功能開發中，請發送郵件到 support@joinbar.com')
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
  margin-bottom: 32px;
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

.success-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.failed-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

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
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 24px;
}

.btn-success,
.btn-retry,
.btn-back,
.btn-support,
.btn-orders {
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-success {
  background: #dc2626;
  color: white;
}

.btn-success:hover {
  background: #b91c1c;
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

.btn-support {
  background: #1d4ed8;
  color: white;
}

.btn-support:hover {
  background: #1e40af;
}

.btn-orders {
  background: #7c3aed;
  color: white;
}

.btn-orders:hover {
  background: #6d28d9;
}

.info-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.info-section h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.info-section ul {
  margin: 0;
  padding-left: 20px;
}

.info-section li {
  margin: 8px 0;
  color: #6b7280;
  line-height: 1.5;
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