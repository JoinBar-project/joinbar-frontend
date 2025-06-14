<template>
  <div class="success-container">
    <div v-if="orderLoading" class="loading-box">
      <div class="spinner"></div>
      <p>載入訂單資訊中...</p>
    </div>

    <div v-else-if="orderError" class="error-section">
      <div class="error-icon">❌</div>
      <h2>載入失敗</h2>
      <p class="error-description">{{ orderError }}</p>
      <div class="error-actions">
        <button class="btn-secondary" :disabled="retrying" @click="handleRetry">
          {{ retrying ? '重新載入中...' : '重新載入' }}
        </button>
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
            <span class="value total-amount">${{ formatAmount(orderInfo.totalAmount) }}</span>
          </div>
        </div>
      </div>

      <div v-if="orderInfo.items?.length" class="info-card">
        <div class="card-header">
          <h3>已購買活動 ({{ orderInfo.items.length }} 項)</h3>
        </div>
        <div class="events-list">
          <div v-for="item in orderInfo.items" :key="item.id" class="event-item">
            <div class="event-info">
              <RouterLink v-if="item.eventId" :to="`/event/${item.eventId}`">
                <h4 class="event-link">{{ item.eventName }}</h4>
              </RouterLink>
              <h4 v-else>{{ item.eventName }}</h4>
              <p class="event-meta">📍 {{ item.barName }}</p>
              <p class="event-meta" v-if="item.location">{{ item.location }}</p>
              <p class="event-meta" v-if="item.eventStartDate">
                🕒 {{ formatEventTime(item.eventStartDate) }}
              </p>
            </div>
            <div class="event-price">${{ formatAmount(item.price) }}</div>
          </div>
        </div>
      </div>

      <div class="action-buttons">
        <button class="btn-outline" @click="goToEvents">繼續瀏覽活動</button>
        <button class="btn-secondary" @click="goToCart">返回購物車</button>
      </div>
    </div>

    <div v-if="copyToast" class="copy-toast">
      {{ copyToast }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useOrder } from '@/composable/useOrder'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

const route = useRoute()
const router = useRouter()

const {
  getOrderDetails,
  getStatusText,
  getPaymentMethodText,
  isLoading: orderLoading,
  error: orderError,
  clearError: clearOrderError,
} = useOrder()

const orderInfo = ref(null)
const retrying = ref(false)
const copyToast = ref('')

function formatAmount(amount) {
  return Number(amount).toLocaleString('zh-TW', { minimumFractionDigits: 0 })
}

function formatDateTime(dateString) {
  if (!dateString) return '-'
  return dayjs(dateString).tz('Asia/Taipei').format('YYYY年MM月DD日 HH:mm')
}

function formatEventTime(dateString) {
  if (!dateString) return '-'
  return dayjs(dateString).tz('Asia/Taipei').format('MM月DD日 HH:mm')
}

function getStatusClass(status) {
  return ({
    pending: 'status-pending',
    paid: 'status-paid',
    confirmed: 'status-confirmed',
    cancelled: 'status-cancelled',
    refunded: 'status-refunded',
    expired: 'status-expired'
  })[status] || 'status-default'
}

async function loadOrderData() {
  try {
    const orderId = route.query.orderId || route.params.orderId
    if (!orderId) throw new Error('缺少訂單 ID')
    const response = await getOrderDetails(orderId)
    orderInfo.value = response.order
  } catch (err) {
    orderInfo.value = null
  }
}

async function handleRetry() {
  retrying.value = true
  clearOrderError()
  await loadOrderData()
  retrying.value = false
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    showToast('✅ 訂單編號已複製')
  } catch (err) {
    try {
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      showToast('✅ 訂單編號已複製')
    } catch {
      showToast('❌ 複製失敗，請手動複製')
    }
  }
}

function showToast(msg) {
  copyToast.value = msg
  setTimeout(() => { copyToast.value = '' }, 2000)
}

function goToEvents() {
  router.push('/event')
}

function goToCart() {
  router.push('/cart')
}

onMounted(loadOrderData)
</script>

<style scoped>
.event-link {
  color: #1e40af;
  text-decoration: underline;
  cursor: pointer;
}
.event-link:hover {
  color: #2563eb;
}
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