<template>
  <div class="container">
    <div v-if="isLoading" class="loading">
      <div class="spinner"></div>
      <p>載入中...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>❌ {{ error }}</p>
      <button @click="retry" class="btn">重試</button>
    </div>

    <div v-else-if="orderInfo" class="content">
      <div class="header">
        <div v-if="['confirmed', 'paid'].includes(orderInfo.status)" class="icon">✅</div>
        <div v-else-if="orderInfo.status === 'pending'" class="icon">📋</div>
        <div v-else-if="orderInfo.status === 'cancelled'" class="icon">🚫</div>
        
        <h1 v-if="['confirmed', 'paid'].includes(orderInfo.status)">付款成功！</h1>
        <h1 v-else-if="orderInfo.status === 'pending'">訂單詳情</h1>
        <h1 v-else-if="orderInfo.status === 'cancelled'">訂單已取消</h1>

        <p v-if="['confirmed', 'paid'].includes(orderInfo.status)">感謝您的購買！</p>
        <p v-else-if="orderInfo.status === 'pending'">此訂單尚未付款</p>
        <p v-else-if="orderInfo.status === 'cancelled'">此訂單已由您取消</p>
      </div>

      <div class="card">
        <div class="row">
          <span>訂單編號</span>
          <span>{{ orderInfo.orderNumber }}</span>
        </div>
        <div class="row">
          <span>狀態</span>
          <span class="order-status-label" :class="orderInfo.status">{{ getStatusText(orderInfo.status) }}</span>
        </div>
        <div class="row">
          <span>總金額</span>
          <span class="amount">${{ formatAmount(orderInfo.totalAmount) }}</span>
        </div>
        <div v-if="orderInfo.paymentMethod" class="row">
          <span>付款方式</span>
          <span>LINE Pay</span>
        </div>
      </div>

      <div v-if="orderInfo.items?.length" class="card">
        <h3>購買項目 ({{ orderInfo.items.length }})</h3>
        <div v-for="item in orderInfo.items" :key="item.id" class="item">
          <div>
            <div class="item-name">{{ getItemDisplayName(item) }}</div>
            <div v-if="getItemSubtitle(item)" class="item-bar">{{ getItemSubtitle(item) }}</div>
          </div>
          <div class="item-price">${{ formatAmount(item.price) }}</div>
        </div>
      </div>

      <div class="actions">
        <button @click="goToEvents" class="btn btn-outline">瀏覽活動</button>
        
        <button v-if="orderInfo.status === 'pending'" @click="retryPayment" class="btn btn-primary">
          繼續付款
        </button>
        <button v-else @click="goToOrders" class="btn btn-primary">
          我的訂單
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrder } from '@/composables/useOrder'

const route = useRoute()
const router = useRouter()
const { getOrderDetails, getStatusText, formatAmount } = useOrder()

const orderInfo = ref(null)
const isLoading = ref(true)
const error = ref('')

onMounted(async () => {
  if (window.opener) {
    const result = {
      success: true,
      orderId: route.query.orderId,
      orderNumber: route.params.orderNumber || route.query.orderNumber || 'unknown',
      message: '付款成功'
    };
    
    localStorage.setItem('linepay-result', JSON.stringify(result));
    
    document.body.innerHTML = '<div style="text-align:center;margin-top:100px;font-size:24px;">✅ 付款成功！視窗即將關閉...</div>';
    
    setTimeout(() => window.close(), 1500);
    return;
  }
  
  await loadOrder();
});

const loadOrder = async () => {
  try {
    isLoading.value = true
    error.value = ''
    
    let orderId = route.query.orderId || route.params.orderId
    
    if (!orderId) {
      const pending = sessionStorage.getItem('pendingOrder')
      if (pending) {
        orderId = JSON.parse(pending).orderId
        sessionStorage.removeItem('pendingOrder')
      }
    }
    
    if (!orderId) {
      const orderNumber = route.params.orderNumber;
      if(!orderNumber) throw new Error('找不到訂單ID或訂單編號');
    }
    
    const response = await getOrderDetails(orderId || route.params.orderNumber)
    orderInfo.value = response.order
    
    if (response.order.items && response.order.items.length > 0) {
      const hasSubscription = response.order.items.some(item => item.itemType === 2)
      const hasEvent = response.order.items.some(item => item.itemType === 1)
      
      if (hasSubscription && !hasEvent) {
        console.log('🔄 檢測到訂閱訂單，重定向到 payment-result');
        router.replace({
          path: '/payment-result',
          query: {
            orderId: response.order.id,
            orderNumber: response.order.orderNumber,
            transactionId: response.order.transactionId || route.query.transactionId || 'completed'
          }
        });
        return;
      }
    }
    
  } catch (err) {
    error.value = err.message || '載入失敗'
  } finally {
    isLoading.value = false
  }
}

const getItemDisplayName = (item) => {
  if (item.itemType === 2) {
    return getSubscriptionName(item.subscriptionType) || '訂閱方案'
  } else {
    return item.eventName || '活動票券'
  }
}

const getItemSubtitle = (item) => {
  if (item.itemType === 2) {
    const duration = getSubscriptionDuration(item.subscriptionType)
    return `📋 ${item.subscriptionType || '訂閱服務'}${duration ? ` (${duration})` : ''}`
  } else {
    return item.barName ? `📍 ${item.barName}` : null
  }
}

const getSubscriptionName = (subType) => {
  const subNames = {
    'vip': '尊爵黑卡',
    'seasonal': '季訂方案', 
    'monthly': '小資月卡'
  }
  return subNames[subType] || subType
}

const getSubscriptionDuration = (subType) => {
  const durations = {
    'vip': '365天',
    'seasonal': '90天',
    'monthly': '30天'
  }
  return durations[subType] || ''
}

const retry = () => loadOrder()

const retryPayment = () => {
  router.push({ 
    name: 'Payment', 
    query: { retryOrderId: orderInfo.value.id }
  })
}

const goToEvents = () => router.push('/event')

const goToOrders = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user'))
    router.push({ name: 'MemberOrderRecords', params: { id: user.id }})
  } catch {
    router.push('/login')
  }
}
</script>

<style scoped>
.container {
  max-width: 600px;
  margin: 40px auto;
  padding: 20px;
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
}

.order-status-label {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.order-status-label.pending { background: #fef3c7; color: #92400e; }
.order-status-label.confirmed, .order-status-label.paid { background: #d1fae5; color: #065f46; }
.order-status-label.cancelled { background: #e5e7eb; color: #4b5563; }

.loading, .error {
  text-align: center;
  padding: 60px 20px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #333;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.header {
  text-align: center;
  padding: 40px 20px;
  background: #f8fafc;
  border-radius: 12px;
}

.icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.header h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #333;
}

.header p {
  margin: 0;
  color: #666;
}

.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 24px;
}

.card h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
}

.row:last-child {
  border-bottom: none;
}

.amount {
  color: #dc2626;
  font-weight: 600;
  font-size: 18px;
}

.item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
}

.item:last-child {
  border-bottom: none;
}

.item-name {
  font-weight: 500;
  color: #333;
}

.item-bar {
  font-size: 13px;
  color: #666;
  margin-top: 4px;
}

.item-price {
  color: #dc2626;
  font-weight: 500;
}

.actions {
  display: flex;
  gap: 12px;
}

.btn {
  flex: 1;
  padding: 12px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  min-height: 48px;
}

.btn-primary {
  background: #dc2626;
  color: white;
}

.btn-primary:hover {
  background: #b91c1c;
}

.btn-outline {
  background: white;
  color: #dc2626;
  border: 1px solid #dc2626;
}

.btn-outline:hover {
  background: #dc2626;
  color: white;
}

/* 767px以下移动端微调 */
@media (max-width: 767px) {
  .container {
    margin: 20px auto;
    padding: 16px;
    width: calc(100% - 32px);
    max-width: 600px;
  }

  .header {
    padding: 32px 16px;
  }

  .header h1 {
    font-size: 20px;
  }

  .icon {
    font-size: 40px;
    margin-bottom: 12px;
  }

  .card {
    padding: 20px;
  }

  .actions {
    flex-direction: column;
    gap: 12px;
  }

  .btn {
    width: 100%;
    padding: 16px 20px;
    font-size: 15px;
    min-height: 52px;
  }

  .row, .item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 16px 0;
  }

  .row span:first-child, .item-name {
    font-size: 14px;
    color: #666;
    font-weight: 500;
  }

  .row span:last-child {
    font-size: 15px;
    font-weight: 600;
    color: #333;
  }

  .amount {
    font-size: 18px;
  }

  .item-price {
    font-size: 16px;
    align-self: flex-end;
    margin-top: 4px;
  }

  .order-status-label {
    padding: 6px 12px;
    font-size: 13px;
  }
}

/* 480px以下小屏幕微调 */
@media (max-width: 480px) {
  .container {
    margin: 16px auto;
    padding: 12px;
    width: calc(100% - 24px);
    max-width: 600px;
  }

  .header {
    padding: 24px 12px;
  }

  .header h1 {
    font-size: 18px;
  }

  .icon {
    font-size: 36px;
  }

  .card {
    padding: 16px;
  }

  .btn {
    padding: 14px 16px;
    font-size: 14px;
    min-height: 48px;
  }
}
</style>