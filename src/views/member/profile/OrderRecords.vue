<template>
  <div class="orders-container">
    <div class="orders-header">
      <h1>我的訂單</h1>
      <div class="stats">
        <span>總計 {{ orders.length }} 筆訂單</span>
        <span v-if="totalAmount > 0" class="total-amount">
          總金額 ${{ formatAmount(totalAmount) }}
        </span>
      </div>
    </div>

    <div v-if="isLoading" class="loading">
      <div class="spinner"></div>
      <p>載入中...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>❌ {{ error }}</p>
      <button @click="loadOrders" class="btn" :disabled="isLoading">
        {{ isLoading ? '載入中...' : '重新載入' }}
      </button>
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
          <option value="paid">已付款</option>
          <option value="cancelled">已取消</option>
          <option value="refunded">已退款</option>
        </select>
        
        <input 
          v-model="searchKeyword" 
          type="text" 
          placeholder="搜尋訂單編號或活動名稱"
          class="search"
        />
        
        <button @click="clearFilters" class="btn-clear">清除</button>
      </div>

      <div class="filter-info">
        <span>顯示 {{ filteredOrders.length }} / {{ orders.length }} 筆訂單</span>
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
            <span class="status" :class="getStatusClass(order.status)">
              {{ getStatusText(order.status) }}
            </span>
          </div>

          <div class="order-content">
            <div class="order-info">
              <span>總金額：<strong>${{ formatAmount(order.totalAmount) }}</strong></span>
              <span v-if="order.paymentMethod">
                付款：{{ getPaymentText(order.paymentMethod) }}
              </span>
              <span v-if="order.paidAt">
                付款時間：{{ formatDate(order.paidAt) }}
              </span>
            </div>

            <div v-if="order.cancelledAt" class="cancel-info">
              <span class="cancel-time">取消時間：{{ formatDate(order.cancelledAt) }}</span>
              <span v-if="order.cancellationReason" class="cancel-reason">
                取消原因：{{ order.cancellationReason }}
              </span>
            </div>

            <div v-if="order.items?.length" class="items">
              <h4>購買項目 ({{ order.items.length }})</h4>
              <div v-for="item in order.items" :key="item.id" class="item">
                <div class="item-details">
                  <span class="item-name">{{ item.eventName }}</span>
                  <span v-if="item.barName" class="item-bar">📍 {{ item.barName }}</span>
                  <span v-if="item.eventStartDate" class="item-date">
                    🕒 {{ formatDate(item.eventStartDate) }}
                  </span>
                </div>
                <span class="item-price">${{ formatAmount(item.price) }}</span>
              </div>
            </div>
          </div>

          <div class="order-actions">
            <button @click="viewOrder(order.id)" class="btn">
              📋 查看詳情
            </button>
            
            <button 
              v-if="order.status === 'pending'" 
              @click="cancelOrder(order.id)"
              class="btn-danger"
              :disabled="cancellingOrder === order.id"
            >
              {{ cancellingOrder === order.id ? '取消中...' : '❌ 取消訂單' }}
            </button>

            <button 
              v-if="order.status === 'pending'" 
              @click="retryPayment(order.id)"
              class="btn-primary"
            >
              💳 重新付款
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="toast.show" class="toast" :class="toast.type">
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useOrder } from '@/composables/useOrder'
import dayjs from 'dayjs'

const router = useRouter()

const {
  getUserOrderHistory,
  cancelOrder: cancelOrderAPI,
  isLoading,
  error,
  clearError
} = useOrder()

const orders = ref([])
const statusFilter = ref('')
const searchKeyword = ref('')
const cancellingOrder = ref(null)

const toast = ref({
  show: false,
  message: '',
  type: 'success'
})

const totalAmount = computed(() => {
  return orders.value
    .filter(order => ['confirmed', 'paid'].includes(order.status))
    .reduce((sum, order) => sum + parseFloat(order.totalAmount || 0), 0)
})

const filteredOrders = computed(() => {
  let filtered = orders.value

  if (statusFilter.value) {
    filtered = filtered.filter(order => order.status === statusFilter.value)
  }

  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(order => {
      const orderNumber = order.orderNumber?.toLowerCase() || ''
      const eventNames = order.items?.map(item => 
        item.eventName?.toLowerCase()).join(' ') || ''
      
      return orderNumber.includes(keyword) || eventNames.includes(keyword)
    })
  }

  return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
})

const loadOrders = async () => {
  try {
    clearError()
    console.log('🔄 開始載入訂單歷史...')
    
    const response = await getUserOrderHistory()
    orders.value = response.orders || []
    
    console.log('✅ 訂單載入成功:', {
      total: response.total,
      ordersCount: orders.value.length
    })
    
    showToast(`✅ 載入了 ${orders.value.length} 筆訂單`, 'success')
    
  } catch (err) {
    console.error('❌ 載入訂單失敗:', err)
    
    let errorMessage = '載入訂單失敗'
    if (err.message.includes('登入已過期')) {
      errorMessage = '登入已過期，請重新登入'
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } else if (err.message.includes('網路')) {
      errorMessage = '網路連線有問題，請檢查網路後重試'
    } else if (err.message) {
      errorMessage = err.message
    }
    
    showToast(`❌ ${errorMessage}`, 'error')
  }
}

const cancelOrder = async (orderId) => {
  if (!confirm('確定要取消這個訂單嗎？\n\n取消後將無法恢復，已付款金額將申請退款。')) {
    return
  }
  
  const reason = prompt('請輸入取消原因（選填）：') || '用戶主動取消'
  
  try {
    cancellingOrder.value = orderId
    console.log('🚫 開始取消訂單:', orderId, '原因:', reason)
    
    await cancelOrderAPI(orderId, reason)
    
    const orderIndex = orders.value.findIndex(order => order.id === orderId)
    if (orderIndex !== -1) {
      orders.value[orderIndex].status = 'cancelled'
      orders.value[orderIndex].cancellationReason = reason
      orders.value[orderIndex].cancelledAt = dayjs().toISOString()
    }
    
    console.log('✅ 訂單取消成功')
    showToast('✅ 訂單已成功取消', 'success')
    
  } catch (err) {
    console.error('❌ 取消訂單失敗:', err)
    
    let errorMessage = '取消訂單失敗'
    if (err.message.includes('找不到')) {
      errorMessage = '找不到該訂單'
    } else if (err.message.includes('無權限')) {
      errorMessage = '無權限取消此訂單'
    } else if (err.message.includes('狀態')) {
      errorMessage = '訂單狀態異常，無法取消'
    } else if (err.message) {
      errorMessage = err.message
    }
    
    showToast(`❌ ${errorMessage}`, 'error')
    
  } finally {
    cancellingOrder.value = null
  }
}

const clearFilters = () => {
  statusFilter.value = ''
  searchKeyword.value = ''
  console.log('🗑️ 已清除篩選條件')
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return dayjs(dateString).format('YYYY/MM/DD HH:mm')
}

const formatAmount = (amount) => {
  if (!amount) return '0'
  return Number(amount).toLocaleString()
}

const getStatusText = (status) => {
  const statusMap = {
    pending: '待付款',
    paid: '已付款',
    confirmed: '已確認',
    cancelled: '已取消',
    refunded: '已退款',
    expired: '已過期'
  }
  return statusMap[status] || status
}

const getStatusClass = (status) => {
  return `status-${status}`
}

const getPaymentText = (method) => {
  const methodMap = {
    linepay: 'LINE Pay',
    creditcard: '信用卡'
  }
  return methodMap[method] || method
}

const viewOrder = (orderId) => {
  console.log('🔍 查看訂單詳情:', orderId)
  router.push({ 
    name: 'OrderSuccess', 
    query: { orderId },
    params: { orderNumber: 'from-records' }
  })
}

const retryPayment = (orderId) => {
  console.log('💳 重新付款:', orderId)
  router.push({ 
    name: 'Payment', 
    query: { retryOrderId: orderId }
  })
}

const goToEvents = () => {
  router.push('/event')
}

const showToast = (message, type = 'success') => {
  toast.value = {
    show: true,
    message,
    type
  }
  
  setTimeout(() => {
    toast.value.show = false
  }, 3000)
}

onMounted(async () => {
  console.log('📱 OrderRecords 組件已掛載')
  await loadOrders()
})
</script>

<style scoped>
.orders-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

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

.stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
  color: #666;
  font-size: 14px;
}

.total-amount {
  color: #dc3545;
  font-weight: 600;
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
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  align-items: center;
}

.filters select,
.filters input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
}

.search {
  flex: 1;
  min-width: 200px;
}

.btn-clear {
  background: #6c757d;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
}

.btn-clear:hover {
  background: #5a6268;
}

.filter-info {
  margin-bottom: 20px;
  color: #666;
  font-size: 14px;
  text-align: right;
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
  transition: box-shadow 0.2s;
}

.order-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.order-card.pending { border-left: 4px solid #ffc107; }
.order-card.paid { border-left: 4px solid #17a2b8; }
.order-card.confirmed { border-left: 4px solid #28a745; }
.order-card.cancelled { border-left: 4px solid #dc3545; }
.order-card.refunded { border-left: 4px solid #6f42c1; }

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

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

.status {
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: 500;
}

.status-pending { background: #fff3cd; color: #856404; }
.status-paid { background: #d1ecf1; color: #0c5460; }
.status-confirmed { background: #d4edda; color: #155724; }
.status-cancelled { background: #f8d7da; color: #721c24; }
.status-refunded { background: #e2d9f3; color: #4a1a4a; }

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

.cancel-info {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 5px;
  padding: 10px;
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.cancel-time {
  font-size: 13px;
  color: #721c24;
  font-weight: 500;
}

.cancel-reason {
  font-size: 13px;
  color: #721c24;
  font-style: italic;
}

.items {
  margin-top: 15px;
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

.item-bar, .item-date {
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
  transition: background-color 0.2s;
  flex: 1;
}

.btn:disabled,
.btn-danger:disabled,
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn {
  background: #007bff;
  color: white;
}

.btn:hover:not(:disabled) {
  background: #0056b3;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.btn-primary {
  background: #28a745;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #218838;
}

.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  padding: 15px 20px;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.toast.success {
  background: #28a745;
}

.toast.error {
  background: #dc3545;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
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
  
  .stats {
    align-items: flex-start;
  }
  
  .filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search {
    min-width: auto;
  }
  
  .order-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .order-info {
    gap: 5px;
  }
  
  .order-actions {
    flex-direction: column;
  }
  
  .toast {
    left: 15px;
    right: 15px;
    bottom: 15px;
  }
}
</style>