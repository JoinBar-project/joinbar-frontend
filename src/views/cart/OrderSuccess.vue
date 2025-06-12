<template>
  <div class="success-container">
    <div v-if="isLoading || orderLoading" class="loading-box">
      <div class="spinner"></div>
      <p>載入訂單資訊中...</p>
    </div>
 
    <div v-else-if="error || orderError" class="error-section">
      <div class="error-icon">❌</div>
      <h2>載入失敗</h2>
      <p class="error-description">{{ error || orderError }}</p>
      <div class="error-actions">
        <button class="btn-secondary" @click="handleRetry">重新載入</button>
        <button class="btn-primary" @click="goToCart">返回購物車</button>
      </div>
    </div>
 
    <div v-else-if="orderInfo" class="success-content">
      
      <div class="success-header">
        <div class="success-icon">✅</div>
        <h1>付款成功！</h1>
        <p class="success-subtitle">感謝您的購買，期待在活動中見到您！</p>
      </div>
 
      <div class="info-card">
        <div class="card-header">
          <h2>訂單詳情</h2>
          <span class="status-badge" :class="getStatusClass(orderInfo.status)">
            {{ getStatusText(orderInfo.status) }}
          </span>
        </div>
 
        <div class="order-info">
          <div class="info-row">
            <span class="label">訂單編號</span>
            <span class="value copy-text" @click="copyToClipboard(orderInfo.orderNumber)">
              {{ orderInfo.orderNumber }}
              <small class="copy-hint">(點擊複製)</small>
            </span>
          </div>
          
          <div class="info-row">
            <span class="label">建立時間</span>
            <span class="value">{{ formatDateTime(orderInfo.createdAt) }}</span>
          </div>
          
          <div class="info-row" v-if="orderInfo.paidAt">
            <span class="label">付款時間</span>
            <span class="value">{{ formatDateTime(orderInfo.paidAt) }}</span>
          </div>
          
          <div class="info-row" v-if="orderInfo.paymentMethod">
            <span class="label">付款方式</span>
            <span class="value">{{ getPaymentMethodText(orderInfo.paymentMethod) }}</span>
          </div>
          
          <div class="info-row total-row">
            <span class="label">總金額</span>
            <span class="value total-amount">
              ${{ formatAmount(orderInfo.totalAmount) }}
            </span>
          </div>
        </div>
      </div>
 
      <div v-if="orderInfo.items && orderInfo.items.length > 0" class="info-card">
        <div class="card-header">
          <h3>已購買活動 ({{ orderInfo.items.length }} 項)</h3>
        </div>
        
        <div class="events-list">
          <div 
            v-for="item in orderInfo.items" 
            :key="item.id" 
            class="event-item"
          >
            <div class="event-info">
              <h4>{{ item.eventName }}</h4>
              <p class="event-meta">📍 {{ item.barName }}</p>
              <p class="event-meta" v-if="item.location">{{ item.location }}</p>
              <p class="event-meta" v-if="item.eventStartDate">
                🕒 {{ formatEventTime(item.eventStartDate) }}
              </p>
            </div>
            
            <div class="event-price">
              ${{ formatAmount(item.price) }}
            </div>
          </div>
        </div>
      </div>
 
      <div class="action-buttons">
        <button class="btn-outline" @click="goToEvents">
          繼續瀏覽活動
        </button>
        
        <button class="btn-secondary" @click="goToCart">
          返回購物車
        </button>
      </div>
    </div>
 
    <div v-if="copySuccess" class="copy-toast">
      ✅ 訂單編號已複製到剪貼板
    </div>
  </div>
 </template>
 
 <script setup>
 import { ref, computed, onMounted } from 'vue'
 import { useRoute, useRouter } from 'vue-router'
 import { useOrder } from '@/composables/useOrder'
 
 const route = useRoute()
 const router = useRouter()
 
 const { 
  getOrderDetails,
  formatDateTime,
  formatAmount,
  getStatusText,
  getPaymentMethodText,
  isLoading: orderLoading,
  error: orderError,
  clearError: clearOrderError
 } = useOrder()
 
 const isLoading = ref(true)
 const error = ref('')
 const orderInfo = ref(null)
 const copySuccess = ref(false)
 
 const formatEventTime = (dateString) => {
  if (!dateString) return '-'
  try {
    return new Date(dateString).toLocaleString('zh-TW', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (err) {
    return dateString
  }
 }
 
 onMounted(async () => {
  await loadOrderData()
 })
 
 async function loadOrderData() {
  try {
    const orderNumber = route.params.orderNumber
    const orderId = route.query.orderId
 
    console.log('🔄 載入訂單資料:', { orderNumber, orderId })
 
    if (!orderNumber) {
      throw new Error('缺少訂單編號')
    }
    
    if (!orderId) {
      throw new Error('缺少訂單 ID')
    }
 
    const response = await getOrderDetails(orderId)
    orderInfo.value = response.order
 
    if (orderInfo.value.orderNumber !== orderNumber) {
      throw new Error('訂單編號不匹配')
    }
 
    console.log('✅ 訂單資料載入成功:', orderInfo.value.orderNumber)
 
  } catch (err) {
    console.error('❌ 載入訂單失敗:', err)
    handleLoadError(err)
  } finally {
    isLoading.value = false
  }
 }
 
 function handleLoadError(err) {
  if (err.message.includes('登入已過期')) {
    error.value = '登入已過期，請重新登入後查看訂單'
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_info')
  } else if (err.message.includes('找不到')) {
    error.value = '找不到該訂單，請檢查訂單編號'
  } else if (err.message.includes('不匹配')) {
    error.value = '訂單資訊不匹配，請重新確認'
  } else {
    error.value = err.message || '載入訂單資訊失敗，請稍後再試'
  }
 }
 
 async function handleRetry() {
  isLoading.value = true
  error.value = ''
  clearOrderError()
  await loadOrderData()
 }
 
 function getStatusClass(status) {
  const classMap = {
    'pending': 'status-pending',
    'paid': 'status-paid', 
    'confirmed': 'status-confirmed',
    'cancelled': 'status-cancelled',
    'refunded': 'status-refunded',
    'expired': 'status-expired'
  }
  return classMap[status] || 'status-default'
 }
 
 async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    copySuccess.value = true
    setTimeout(() => {
      copySuccess.value = false
    }, 2000)
  } catch (err) {
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    copySuccess.value = true
    setTimeout(() => {
      copySuccess.value = false
    }, 2000)
  }
 }
 
 function goToEvents() {
  router.push('/event')
 }
 
 function goToCart() {
  router.push('/cart')
 }
 </script>
 
 <style scoped>
 .success-container {
  max-width: 800px;
  margin: 48px auto;
  padding: 40px;
  font-size: 15px;
 }
 
 .loading-box {
  text-align: center;
  padding: 48px 0;
  color: #666;
 }
 
 .spinner {
  margin: 16px auto;
  width: 40px;
  height: 40px;
  border: 4px solid #eee;
  border-top: 4px solid #10b981;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
 }
 
 @keyframes spin {
  to { transform: rotate(360deg); }
 }
 
 .error-section {
  text-align: center;
  padding: 80px 40px;
  color: #666;
 }
 
 .error-icon {
  font-size: 64px;
  margin-bottom: 24px;
 }
 
 .error-section h2 {
  color: #dc2626;
  margin-bottom: 16px;
  font-size: 24px;
 }
 
 .error-description {
  color: #666;
  margin-bottom: 32px;
  font-size: 16px;
  line-height: 1.5;
 }
 
 .error-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
 }
 
 .success-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
 }
 
 .success-header {
  text-align: center;
  padding: 48px 32px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 16px;
 }
 
 .success-icon {
  font-size: 64px;
  margin-bottom: 24px;
 }
 
 .success-header h1 {
  color: #1e40af;
  margin-bottom: 12px;
  font-size: 28px;
  font-weight: 700;
 }
 
 .success-subtitle {
  color: #64748b;
  font-size: 16px;
  margin: 0;
 }
 
 .info-card {
  background-color: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  padding: 32px;
  border: 1px solid #f1f5f9;
 }
 
 .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f1f5f9;
 }
 
 .card-header h2,
 .card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
 }
 
 .status-badge {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
 }
 
 .status-paid,
 .status-confirmed {
  background: #dcfce7;
  color: #166534;
 }
 
 .status-pending {
  background: #fef3c7;
  color: #92400e;
 }
 
 .status-cancelled,
 .status-refunded {
  background: #fee2e2;
  color: #991b1b;
 }
 
 .order-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
 }
 
 .info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f8fafc;
 }
 
 .info-row:last-child {
  border-bottom: none;
 }
 
 .label {
  color: #64748b;
  font-weight: 500;
  font-size: 14px;
 }
 
 .value {
  color: #1f2937;
  font-weight: 600;
  text-align: right;
 }
 
 .total-row {
  background: #f8fafc;
  margin: 16px -16px 0;
  padding: 16px;
  border-radius: 8px;
  border: none !important;
 }
 
 .total-amount {
  color: #dc2626;
  font-size: 20px;
  font-weight: 700;
 }
 
 .copy-text {
  cursor: pointer;
  padding: 4px 8px;
  background: #f8fafc;
  border-radius: 4px;
  transition: all 0.2s;
 }
 
 .copy-text:hover {
  background: #e2e8f0;
 }
 
 .copy-hint {
  color: #64748b;
  font-size: 11px;
  opacity: 0.7;
 }
 
 .events-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
 }
 
 .event-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
 }
 
 .event-info h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
 }
 
 .event-meta {
  margin: 4px 0;
  font-size: 13px;
  color: #64748b;
 }
 
 .event-price {
  color: #dc2626;
  font-size: 16px;
  font-weight: 700;
 }
 
 .action-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
 }
 
 .btn-primary,
 .btn-secondary,
 .btn-outline {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
 }
 
 .btn-primary {
  background-color: #dc2626;
  color: white;
 }
 
 .btn-primary:hover {
  background-color: #b91c1c;
 }
 
 .btn-secondary {
  background-color: #6b7280;
  color: white;
 }
 
 .btn-secondary:hover {
  background-color: #4b5563;
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
 
 .copy-toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #10b981;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
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
  .success-container {
    margin: 24px 16px;
    padding: 24px;
  }
  
  .info-card {
    padding: 20px;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .info-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .value {
    text-align: left;
  }
  
  .event-item {
    flex-direction: column;
    gap: 12px;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .copy-toast {
    left: 16px;
    right: 16px;
    bottom: 16px;
  }
 }
 </style>