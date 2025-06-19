<template>
  <div class="orders-container">
    <div class="orders-header">
      <h1>我的訂單</h1>
      <div class="orders-stats">
        <div class="stat-item">
          <span class="stat-number">{{ stats.totalOrders }}</span>
          <span class="stat-label">總訂單</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">${{ formattedTotalAmount }}</span>
          <span class="stat-label">總金額</span>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="loading-section">
      <div class="spinner"></div>
      <p>載入訂單中...</p>
    </div>

    <div v-else-if="error" class="error-section">
      <div class="error-icon">❌</div>
      <h3>載入失敗</h3>
      <p>{{ error }}</p>
      <button @click="loadOrders" class="retry-btn">重新載入</button>
    </div>

    <div v-else-if="orders.length === 0" class="empty-orders">
      <h3>還沒有訂單</h3>
      <p>快去尋找喜歡的活動吧！</p>
      <button @click="goToEvents" class="go-shopping-btn">開始購物</button>
    </div>

    <div v-else>
      <div class="filters-section">
        <div class="filter-group">
          <label for="status-filter">訂單狀態</label>
          <select id="status-filter" v-model="statusFilter" class="filter-select">
            <option value="">所有狀態</option>
            <option value="pending">待付款</option>
            <option value="confirmed">已確認</option>
            <option value="paid">已付款</option>
            <option value="cancelled">已取消</option>
            <option value="refunded">已退款</option>
          </select>
        </div>

        <div class="filter-group">
          <label for="payment-filter">付款方式</label>
          <select id="payment-filter" v-model="paymentMethodFilter" class="filter-select">
            <option value="">所有方式</option>
            <option value="linepay">LINE Pay</option>
            <option value="creditcard">信用卡</option>
          </select>
        </div>

        <div class="filter-group">
          <label for="date-filter">日期範圍</label>
          <select id="date-filter" v-model="dateRangeFilter" class="filter-select">
            <option value="">所有時間</option>
            <option value="today">今天</option>
            <option value="week">本週</option>
            <option value="month">本月</option>
            <option value="quarter">近三個月</option>
          </select>
        </div>

        <div class="filter-group search-group">
          <label for="search-input">搜尋</label>
          <input 
            id="search-input"
            v-model="searchKeyword" 
            type="text" 
            placeholder="訂單編號或活動名稱"
            class="search-input"
          />
        </div>

        <div class="filter-actions">
          <button @click="clearFilters" class="clear-filters-btn">
            🗑️ 清除篩選
          </button>
        </div>
      </div>

      <div class="filter-results">
        <div class="results-info">
          <span class="results-count">
            顯示 <strong>{{ filteredOrders.length }}</strong> / {{ orders.length }} 筆訂單
          </span>
          <span v-if="hasActiveFilters" class="active-filters">
            (已套用篩選條件)
          </span>
        </div>

        <div class="sort-options">
          <label for="sort-select">排序：</label>
          <select id="sort-select" v-model="sortBy" class="sort-select">
            <option value="newest">最新訂單</option>
            <option value="oldest">最舊訂單</option>
            <option value="amount-high">金額高→低</option>
            <option value="amount-low">金額低→高</option>
            <option value="status">依狀態</option>
          </select>
        </div>
      </div>

      <div class="orders-content">
        <p>篩選功能已準備好！下一步將實現訂單列表顯示</p>
        <div class="debug-info">
          <h4>除錯資訊：</h4>
          <ul>
            <li>狀態篩選：{{ statusFilter || '無' }}</li>
            <li>付款方式：{{ paymentMethodFilter || '無' }}</li>
            <li>日期範圍：{{ dateRangeFilter || '無' }}</li>
            <li>搜尋關鍵字：{{ searchKeyword || '無' }}</li>
            <li>排序方式：{{ sortBy }}</li>
            <li>篩選後數量：{{ filteredOrders.length }}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useOrder } from '@/composables/useOrder'
import dayjs from 'dayjs'

const router = useRouter()

const {
  getUserOrderHistory,
  isLoading,
  error,
  clearError,
  stats,
  formattedTotalAmount
} = useOrder()

const orders = ref([])

const statusFilter = ref('')
const paymentMethodFilter = ref('')
const dateRangeFilter = ref('')
const searchKeyword = ref('')
const sortBy = ref('newest')

const hasActiveFilters = computed(() => {
  return statusFilter.value || 
         paymentMethodFilter.value || 
         dateRangeFilter.value || 
         searchKeyword.value.trim()
})

const filteredOrders = computed(() => {
  let filtered = [...orders.value]

  if (statusFilter.value) {
    filtered = filtered.filter(order => order.status === statusFilter.value)
  }

  if (paymentMethodFilter.value) {
    filtered = filtered.filter(order => order.paymentMethod === paymentMethodFilter.value)
  }

  if (dateRangeFilter.value) {
    const now = dayjs()
    let startDate

    switch (dateRangeFilter.value) {
      case 'today':
        startDate = now.startOf('day')
        break
      case 'week':
        startDate = now.startOf('week')
        break
      case 'month':
        startDate = now.startOf('month')
        break
      case 'quarter':
        startDate = now.subtract(3, 'month')
        break
    }

    if (startDate) {
      filtered = filtered.filter(order => 
        dayjs(order.createdAt).isAfter(startDate)
      )
    }
  }

  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.trim().toLowerCase()
    filtered = filtered.filter(order => {
      const orderNumber = order.orderNumber?.toLowerCase() || ''
      const eventNames = order.items?.map(item => item.eventName?.toLowerCase()).join(' ') || ''
      
      return orderNumber.includes(keyword) || eventNames.includes(keyword)
    })
  }

  switch (sortBy.value) {
    case 'newest':
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      break
    case 'oldest':
      filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      break
    case 'amount-high':
      filtered.sort((a, b) => parseFloat(b.totalAmount) - parseFloat(a.totalAmount))
      break
    case 'amount-low':
      filtered.sort((a, b) => parseFloat(a.totalAmount) - parseFloat(b.totalAmount))
      break
    case 'status':
      const statusOrder = { pending: 1, paid: 2, confirmed: 3, cancelled: 4, refunded: 5 }
      filtered.sort((a, b) => (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99))
      break
  }

  return filtered
})

const loadOrders = async () => {
  try {
    clearError()
    const response = await getUserOrderHistory()
    orders.value = response.orders
    console.log('✅ 載入了', response.total, '筆訂單')
  } catch (err) {
    console.error('❌ 載入訂單失敗:', err)
  }
}

const clearFilters = () => {
  statusFilter.value = ''
  paymentMethodFilter.value = ''
  dateRangeFilter.value = ''
  searchKeyword.value = ''
  sortBy.value = 'newest'
  console.log('🗑️ 已清除所有篩選條件')
}

const goToEvents = () => {
  router.push('/event')
}

watch([statusFilter, paymentMethodFilter, dateRangeFilter, searchKeyword, sortBy], () => {
  console.log('📊 篩選條件變化:', {
    status: statusFilter.value,
    payment: paymentMethodFilter.value,
    date: dateRangeFilter.value,
    search: searchKeyword.value,
    sort: sortBy.value,
    resultCount: filteredOrders.value.length
  })
}, { deep: true })

onMounted(() => {
  loadOrders()
})
</script>


<style scoped>
.orders-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.orders-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 2px solid #f1f5f9;
}

.orders-header h1 {
  margin: 0;
  color: #1f2937;
  font-size: 28px;
  font-weight: 700;
}

.orders-stats {
  display: flex;
  gap: 24px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
  min-width: 100px;
}

.stat-number {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #dc2626;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #64748b;
}

.loading-section, 
.error-section, 
.empty-orders {
  text-align: center;
  padding: 80px 40px;
  color: #6b7280;
}

.spinner {
  margin: 0 auto 24px auto;
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #dc2626;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-icon {
  font-size: 64px;
  margin-bottom: 24px;
}

.retry-btn, 
.go-shopping-btn {
  background: #dc2626;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 16px;
}

.retry-btn:hover, 
.go-shopping-btn:hover {
  background: #b91c1c;
}

.filters-section {
  background: #f8fafc;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  border: 1px solid #e2e8f0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  align-items: end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-group label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.filter-select,
.search-input {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.filter-select:focus,
.search-input:focus {
  outline: none;
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

.search-group {
  min-width: 250px;
}

.search-input::placeholder {
  color: #9ca3af;
}

.filter-actions {
  display: flex;
  align-items: flex-end;
}

.clear-filters-btn {
  background: #6b7280;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  white-space: nowrap;
}

.clear-filters-btn:hover {
  background: #4b5563;
}

.filter-results {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px 20px;
  background: white;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.results-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.results-count {
  color: #374151;
  font-size: 14px;
}

.results-count strong {
  color: #dc2626;
  font-weight: 600;
}

.active-filters {
  color: #059669;
  font-size: 12px;
  font-weight: 500;
  background: #d1fae5;
  padding: 4px 8px;
  border-radius: 12px;
}

.sort-options {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sort-options label {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.sort-select {
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  min-width: 120px;
}

.orders-content {
  padding: 40px;
  text-align: center;
  background: #f8fafc;
  border-radius: 12px;
  color: #6b7280;
}

.debug-info {
  margin-top: 24px;
  padding: 20px;
  background: #fff3cd;
  border-radius: 8px;
  text-align: left;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.debug-info h4 {
  margin: 0 0 12px 0;
  color: #856404;
}

.debug-info ul {
  margin: 0;
  padding-left: 20px;
  color: #856404;
}

.debug-info li {
  margin: 4px 0;
  font-size: 14px;
}

@media (max-width: 768px) {
  .orders-container {
    padding: 16px;
  }
  
  .orders-header {
    flex-direction: column;
    gap: 20px;
    align-items: stretch;
  }
  
  .orders-stats {
    justify-content: center;
  }
  
  .filters-section {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .search-group {
    min-width: auto;
  }
  
  .filter-results {
    padding: 12px 16px;
  }
  
  .results-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
