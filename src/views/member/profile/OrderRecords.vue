<template>
  <div class="orders-container">
    <div class="orders-header">
      <h1>我的訂單</h1>
      <span class="total-count">共 {{ orders.length }} 筆</span>
    </div>

    <div v-if="isLoading" class="loading">
      <div class="spinner"></div>
      <p>載入中...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>❌ {{ error }}</p>
      <button @click="loadOrders" class="btn">重新載入</button>
    </div>

    <div v-else-if="orders.length === 0" class="empty">
      <h3>還沒有訂單</h3>
      <p>快去尋找喜歡的活動吧！</p>
      <button @click="goToEvents" class="btn">開始購物</button>
    </div>

    <div v-else>
      <div class="filters">
        <select v-model="statusFilter">
          <option value="">所有狀態</option>
          <option value="pending">待付款</option>
          <option value="confirmed">已確認</option>
          <option value="cancelled">已取消</option>
          <option value="expired">已過期</option>    
        </select>
      </div>

      <div class="order-list">
        <div 
          v-for="order in filteredOrders" 
          :key="order.id" 
          class="order-card"
          :class="order.status"
        >
          <div class="order-header">
            <div>
              <h3>{{ order.orderNumber }}</h3>
              <p>{{ formatDate(order.createdAt) }}</p>
            </div>
            <span class="order-status-label" :class="getStatusClass(order.status)">
              {{ getStatusText(order.status) }}
            </span>
          </div>

          <div class="order-content">
            <div class="order-info">
              <span>總金額：<strong>${{ formatAmount(order.totalAmount) }}</strong></span>
              <span v-if="order.paymentMethod">
                付款：LINE Pay
              </span>
            </div>

            <div v-if="order.items?.length" class="items">
              <h4>購買項目 ({{ order.items.length }})</h4>
              <div v-for="item in order.items" :key="item.id" class="item">
                <div class="item-details">
                  <span class="item-name">
                    {{ getItemDisplayName(item) }}
                  </span>
                  <span v-if="getItemSubtitle(item)" class="item-bar">
                    {{ getItemSubtitle(item) }}
                  </span>
                </div>
                <span class="item-price">${{ formatAmount(item.price) }}</span>
              </div>
            </div>
          </div>

          <div class="order-actions">
            <button 
              v-if="order.status === 'confirmed'"
              @click="viewOrder(order.id)" 
              class="btn">
              查看詳情
            </button>
            
            <button 
              v-if="order.status === 'pending'" 
              @click="handleCancelOrder(order.id)"
              class="btn-danger"
              :disabled="isLoading"
            >
              取消訂單
            </button>

            <button 
              v-if="order.status === 'pending'" 
              @click="retryPayment(order.id)"
              class="btn-primary"
            >
              重新付款
            </button>
          </div>
        </div>
      </div>
    </div>

    <BaseAlertModal
      :visible="alertModal.visible"
      :title="alertModal.title"
      :message="alertModal.message"
      :type="alertModal.type"
      :confirm-text="alertModal.confirmText"
      @close="alertModal.visible = false"
    />
    
    <BaseConfirmModal
      :visible="confirmModal.visible"
      :title="confirmModal.title"
      :message="confirmModal.message"
      :type="confirmModal.type"
      :confirm-text="confirmModal.confirmText"
      :cancel-text="confirmModal.cancelText"
      @confirm="confirmModal.onConfirm"
      @cancel="confirmModal.onCancel"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useOrder } from '@/composables/useOrder'
import dayjs from 'dayjs'
import BaseAlertModal from '@/components/common/BaseAlertModal.vue'
import BaseConfirmModal from '@/components/common/BaseConfirmModal.vue'

const router = useRouter()

const {
  getUserOrderHistory,
  cancelOrder: cancelOrderAPI,
  isLoading,
  error
} = useOrder()

const orders = ref([])
const statusFilter = ref('')

const alertModal = ref({
  visible: false,
  title: '',
  message: '',
  type: 'default',
  confirmText: '確認'
})

const confirmModal = ref({
  visible: false,
  title: '',
  message: '',
  type: null,
  confirmText: '確認',
  cancelText: '取消',
  onConfirm: null,
  onCancel: null
})

const showAlert = (title, message, type = 'default', confirmText = '確認') => {
  alertModal.value = { visible: true, title, message, type, confirmText }
}

const showConfirm = (title, message, type = null, confirmText = '確認', cancelText = '取消') => {
  return new Promise((resolve) => {
    confirmModal.value = {
      visible: true,
      title,
      message,
      type,
      confirmText,
      cancelText,
      onConfirm: () => {
        confirmModal.value.visible = false
        resolve(true)
      },
      onCancel: () => {
        confirmModal.value.visible = false
        resolve(false)
      }
    }
  })
}

const filteredOrders = computed(() => {
  let filtered = orders.value
  if (statusFilter.value) {
    filtered = filtered.filter(order => order.status === statusFilter.value)
  }
  return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
})

const loadOrders = async () => {
  try {
    const response = await getUserOrderHistory()
    orders.value = response.orders || []
  } catch (err) {
    showAlert('載入失敗', '載入失敗，請重試', 'error')
  }
}

const handleCancelOrder = async (orderId) => {
  const confirmed = await showConfirm(
    '確認取消訂單',
    '確定取消訂單？此操作無法復原。',
    'danger',
    '取消訂單',
    '保留訂單'
  )
  
  if (!confirmed) return
  
  try {
    await cancelOrderAPI(orderId)
    showAlert('取消成功', '訂單已取消', 'success')
    await loadOrders()
  } catch (err) {
    showAlert('取消失敗', '取消失敗，請重試', 'error')
  }
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return dayjs(dateString).format('MM/DD HH:mm')
}

const formatAmount = (amount) => {
  if (!amount) return '0'
  return Number(amount).toLocaleString()
}

const getStatusText = (status) => {
  const statusMap = {
    pending: '待付款', paid: '已付款', confirmed: '已確認',
    cancelled: '已取消', refunded: '已退款', expired: '已過期'
  }
  return statusMap[status] || status
}

const getStatusClass = (status) => `order-status-label-${status}`

const getItemDisplayName = (item) => {
  if (item.itemType === 2) {
    return getSubscriptionName(item.subscriptionType) || '訂閱方案'
  } else {
    return item.eventName || '活動票券'
  }
}

const getItemSubtitle = (item) => {
  if (item.itemType === 2) {
    return `📋 ${item.subscriptionType || '訂閱服務'}`
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

const viewOrder = (orderId) => {
  const order = orders.value.find(o => o.id === orderId)
  if (!order) {
    showAlert('錯誤', '找不到訂單', 'error')
    return
  }
  
  if (order.items && order.items.length > 0) {
    const hasSubscription = order.items.some(item => item.itemType === 2)
    const hasEvent = order.items.some(item => item.itemType === 1)
    
    if (hasSubscription && !hasEvent) {
      router.push({
        path: '/payment-result',
        query: { 
          orderId: order.id,
          orderNumber: order.orderNumber,
          transactionId: order.transactionId || 'completed'
        }
      })
      return
    }
  }
  
  router.push({ 
    name: 'OrderSuccess', 
    params: { orderNumber: order.orderNumber },
    query: { orderId }
  })
}

const retryPayment = (orderId) => {
  router.push({ 
    name: 'Payment', 
    query: { retryOrderId: orderId }
  })
}

const goToEvents = () => {
  router.push('/event')
}

onMounted(loadOrders)
</script>

<style scoped>
.orders-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.order-status-label {
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.order-status-label-pending { background: #fff3cd; color: #856404; }
.order-status-label-confirmed { background: #d4edda; color: #155724; }
.order-status-label-cancelled { background: #f8d7da; color: #721c24; }
.order-status-label-paid { background: #d1ecf1; color: #0c5460; }
.order-status-label-refunded { background: #e2e3e5; color: #383d41; }
.order-status-label-expired { background: #f5c6cb; color: #721c24; }

.orders-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}
.orders-header h1 {
  margin: 0;
  color: #333;
}
.total-count {
  color: #666;
  font-size: 14px;
}
.loading, .error, .empty {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}
.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #333;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px auto;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.filters {
  margin-bottom: 20px;
}
.filters select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
}
.order-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.order-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  overflow: hidden;
}
.order-card.pending { border-left: 4px solid #ffc107; }
.order-card.confirmed { border-left: 4px solid #28a745; }
.order-card.cancelled { border-left: 4px solid #dc3545; }
.order-header h3 {
  margin: 0 0 5px 0;
  font-size: 16px;
  color: #333;
  font-family: monospace;
}
.order-header p {
  margin: 0;
  font-size: 14px;
  color: #666;
}
.order-content {
  padding: 20px;
}
.order-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 15px;
  font-size: 14px;
  color: #666;
}
.order-info strong {
  color: #dc3545;
  font-size: 16px;
}
.items h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #333;
}
.item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 8px 0;
  border-bottom: 1px solid #f1f1f1;
}
.item:last-child {
  border-bottom: none;
}
.item-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.item-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}
.item-bar {
  font-size: 12px;
  color: #666;
}
.item-price {
  color: #dc3545;
  font-weight: 500;
  margin-left: 10px;
}
.order-actions {
  display: flex;
  gap: 10px;
  padding: 15px 20px;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
}
.btn, .btn-danger, .btn-primary {
  padding: 8px 16px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  flex: 1;
}
.btn { background: #007bff; color: white; }
.btn-danger { background: #dc3545; color: white; }
.btn-primary { background: #28a745; color: white; }
.btn:hover { background: #0056b3; }
.btn-danger:hover { background: #c82333; }
.btn-primary:hover { background: #218838; }
.btn:disabled,
.btn-danger:disabled,
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
@media (max-width: 768px) {
  .orders-container {
    padding: 15px;
  }
  .orders-header {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
  .order-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .order-actions {
    flex-direction: column;
  }
}
</style>