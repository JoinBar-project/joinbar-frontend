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

    <div v-else class="orders-content">
      <p>訂單列表將在下一步實現</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useOrder } from '@/composables/useOrder'

const router = useRouter()

const {
  getUserOrderHistory,
  getStatusText,
  formatAmount,
  formatDateTime,
  isLoading,
  error,
  clearError,
  stats,
  formattedTotalAmount
} = useOrder()

const orders = ref([])

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

const goToEvents = () => {
  router.push('/event')
}

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

.orders-content {
  padding: 40px;
  text-align: center;
  background: #f8fafc;
  border-radius: 12px;
  color: #6b7280;
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
}
</style>
