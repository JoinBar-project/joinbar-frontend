<template>
  <div class="orders-container">
    <div class="orders-header">
      <h1>我的訂單</h1>
      <div class="stats">
        <span>總計 {{ orders.length }} 筆訂單</span>
      </div>
    </div>

    <div v-if="isLoading" class="loading">
      <div class="spinner"></div>
      <p>載入中...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="loadOrders" class="btn">重新載入</button>
    </div>

    <div v-else-if="orders.length === 0" class="empty">
      <h3>還沒有訂單</h3>
      <button @click="goToEvents" class="btn">開始購物</button>
    </div>

    <div v-else>
      <div class="filters">
        <select v-model="statusFilter">
          <option value="">所有狀態</option>
          <option value="pending">待付款</option>
          <option value="confirmed">已確認</option>
          <option value="cancelled">已取消</option>
        </select>
        
        <input 
          v-model="searchKeyword" 
          type="text" 
          placeholder="搜尋訂單編號"
          class="search"
        />
        
        <button @click="clearFilters" class="btn-clear">清除</button>
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
            <span class="status">{{ getStatusText(order.status) }}</span>
          </div>

          <div class="order-content">
            <div class="order-info">
              <span>總金額：<strong>${{ formatAmount(order.totalAmount) }}</strong></span>
              <span v-if="order.paymentMethod">付款：{{ getPaymentText(order.paymentMethod) }}</span>
            </div>

            <div v-if="order.items?.length" class="items">
              <h4>購買項目 ({{ order.items.length }})</h4>
              <div v-for="item in order.items" :key="item.id" class="item">
                <span class="item-name">{{ item.eventName }}</span>
                <span class="item-price">${{ formatAmount(item.price) }}</span>
              </div>
            </div>
          </div>

          <div class="order-actions">
            <button @click="viewOrder(order.id)" class="btn">查看詳情</button>
            <button 
              v-if="order.status === 'pending'" 
              @click="cancelOrder(order.id)"
              class="btn-danger"
            >
              取消訂單
            </button>
          </div>
        </div>
      </div>
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
  isLoading,
  error,
  clearError
} = useOrder()

const orders = ref([])
const statusFilter = ref('')
const searchKeyword = ref('')

const filteredOrders = computed(() => {
  let filtered = orders.value

  if (statusFilter.value) {
    filtered = filtered.filter(order => order.status === statusFilter.value)
  }

  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(order => 
      order.orderNumber?.toLowerCase().includes(keyword)
    )
  }

  return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
})

const loadOrders = async () => {
  try {
    clearError()
    const response = await getUserOrderHistory()
    orders.value = response.orders
  } catch (err) {
    console.error('載入訂單失敗:', err)
  }
}

const clearFilters = () => {
  statusFilter.value = ''
  searchKeyword.value = ''
}

const formatDate = (dateString) => {
  return dayjs(dateString).format('YYYY/MM/DD HH:mm')
}

const formatAmount = (amount) => {
  return Number(amount).toLocaleString()
}

const getStatusText = (status) => {
  const statusMap = {
    pending: '待付款',
    confirmed: '已確認',
    cancelled: '已取消',
    paid: '已付款'
  }
  return statusMap[status] || status
}

const getPaymentText = (method) => {
  const methodMap = {
    linepay: 'LINE Pay',
    creditcard: '信用卡'
  }
  return methodMap[method] || method
}

const viewOrder = (orderId) => {
  router.push({ name: 'OrderSuccess', query: { orderId } })
}

const cancelOrder = async (orderId) => {
  if (!confirm('確定要取消這個訂單嗎？')) return
  
  try {
    alert('訂單取消功能開發中...')
  } catch (err) {
    alert('取消失敗：' + err.message)
  }
}

const goToEvents = () => {
  router.push('/event')
}

onMounted(() => {
  loadOrders()
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
  display: flex;
  gap: 15px;
  margin-bottom: 25px;
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
.order-card.confirmed { border-left: 4px solid #28a745; }
.order-card.cancelled { border-left: 4px solid #dc3545; }

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
  background: #e9ecef;
  color: #495057;
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 12px;
  font-weight: 500;
}

.order-content {
  padding: 20px;
}

.order-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  font-size: 14px;
  color: #666;
}

.order-info strong {
  color: #dc3545;
  font-size: 16px;
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
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f1f1f1;
}

.item:last-child {
  border-bottom: none;
}

.item-name {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.item-price {
  color: #dc3545;
  font-weight: 500;
}

.order-actions {
  display: flex;
  gap: 10px;
  padding: 15px 20px;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

.btn, .btn-danger {
  padding: 8px 16px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.btn {
  background: #007bff;
  color: white;
}

.btn:hover {
  background: #0056b3;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
}

@media (max-width: 768px) {
  .orders-container {
    padding: 15px;
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
    flex-direction: column;
    gap: 5px;
  }
  
  .order-actions {
    flex-direction: column;
  }
}
</style>
