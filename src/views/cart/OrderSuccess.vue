<template>
  <div class="success-container">
    <div v-if="isInPopup" class="popup-notice">
      <div class="popup-content">
        <div class="success-icon">✅</div>
        <h2>付款成功！</h2>
        <p>正在通知主視窗並關閉此視窗...</p>
        <div v-if="orderInfo" class="order-summary">
          <p><strong>訂單編號：</strong>{{ orderInfo.orderNumber }}</p>
          <p><strong>付款金額：</strong>${{ formatAmount(orderInfo.totalAmount) }}</p>
        </div>
      </div>
    </div>

    <div v-else>
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
              <span class="value payment-method">
                <span class="payment-icon" v-if="orderInfo.paymentMethod === 'linepay'">💚</span>
                <span class="payment-icon" v-else-if="orderInfo.paymentMethod === 'creditcard'">💳</span>
                {{ getPaymentMethodText(orderInfo.paymentMethod) }}
              </span>
            </div>
            <div v-if="orderInfo.paymentMethod === 'linepay' && (orderInfo.transactionId || orderInfo.paymentId)" class="info-row">
              <span class="label">LINE Pay 交易號</span>
              <span class="value transaction-id">
                {{ orderInfo.transactionId || orderInfo.paymentId }}
              </span>
            </div>
            <div class="info-row total-row">
              <span class="label">總金額</span>
              <span class="value total-amount">${{ formatAmount(orderInfo.totalAmount) }}</span>
            </div>
          </div>
        </div>

        <div v-if="orderInfo.paymentMethod === 'linepay'" class="linepay-notice">
          <div class="notice-icon">💚</div>
          <div class="notice-content">
            <h3>LINE Pay 付款完成</h3>
            <p>您已成功透過 LINE Pay 完成付款，款項將顯示在您的 LINE Pay 交易記錄中。</p>
            <p>如有任何問題，請保留交易號碼以便查詢：<strong>{{ orderInfo.transactionId || orderInfo.paymentId }}</strong></p>
          </div>
        </div>

        <div v-if="orderInfo.items?.length" class="info-card">
          <div class="card-header">
            <h3>已購買活動 ({{ orderInfo.items.length }} 項)</h3>
          </div>
          <div class="events-list">
            <div v-for="item in orderInfo.items" :key="item.id" class="event-item">
              <div class="event-info">
                <RouterLink v-if="item.eventId" :to="`/event/${item.eventId}`" class="event-link-wrapper">
                  <h4 class="event-link">{{ item.eventName }}</h4>
                </RouterLink>
                <h4 v-else class="event-name">{{ item.eventName }}</h4>
                <div class="event-details">
                  <p class="event-meta">📍 {{ item.barName }}</p>
                  <p class="event-meta" v-if="item.location">{{ item.location }}</p>
                  <p class="event-meta" v-if="item.eventStartDate">
                    🕒 {{ formatEventTime(item.eventStartDate) }}
                  </p>
                  <p class="event-meta" v-if="item.eventEndDate">
                    結束：{{ formatEventTime(item.eventEndDate) }}
                  </p>
                </div>
              </div>
              <div class="event-price">
                <span class="price-label">票價</span>
                <span class="price-value">${{ formatAmount(item.price) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="info-card reminder-card">
          <div class="card-header">
            <h3>溫馨提醒</h3>
          </div>
          <div class="reminder-content">
            <ul>
              <li>📱 請截圖或記住您的訂單編號，以便現場核對</li>
              <li>🕒 請提早 15-30 分鐘到達活動現場</li>
              <li>🆔 現場可能需要出示身份證件核對</li>
              <li>📧 如有疑問，請聯繫客服或活動主辦方</li>
            </ul>
          </div>
        </div>

        <div class="action-buttons">
          <button class="btn-outline" @click="goToEvents">繼續瀏覽活動</button>
          <button class="btn-secondary" @click="goToOrders">查看我的訂單</button>
          <button class="btn-primary" @click="shareOrder">分享給朋友</button>
        </div>
      </div>
    </div>

    <div
      v-if="copyToast"
      class="copy-toast">
      {{ copyToast }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { useOrder } from '@/composables/useOrder';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const route = useRoute();
const router = useRouter();

const {
  getOrderDetails,
  getStatusText,
  getPaymentMethodText,
  formatAmount,
  isLoading: orderLoading,
  error: orderError,
  clearError: clearOrderError,
} = useOrder()

const orderInfo = ref(null)
const retrying = ref(false)
const copyToast = ref('')
const isInPopup = ref(false)

onMounted(async () => {
  isInPopup.value = window.opener && window.opener !== window
  
  console.log('🔍 OrderSuccess 載入:', {
    isInPopup: isInPopup.value,
    hasOpener: !!window.opener,
    query: route.query
  })

  try {
    await loadOrderData()
    
    if (isInPopup.value && orderInfo.value) {
      console.log('📤 在彈出視窗中，準備通知主視窗...')
      handlePopupSuccess()
    }
  } catch (error) {
    console.error('❌ 初始載入失敗:', error)
    
    if (isInPopup.value) {
      handlePopupError(error)
    }
  }
})

const handlePopupSuccess = () => {
  const successData = {
    type: 'LINEPAY_SUCCESS',
    orderId: orderInfo.value.id || orderInfo.value.orderId,
    orderNumber: orderInfo.value.orderNumber,
    status: orderInfo.value.status,
    totalAmount: orderInfo.value.totalAmount,
    paymentMethod: orderInfo.value.paymentMethod
  }
  
  console.log('📤 向主視窗發送成功消息:', successData)
  
  try {
    window.opener.postMessage(successData, window.location.origin)
    console.log('✅ 消息發送成功')
  } catch (error) {
    console.error('❌ 消息發送失敗:', error)
  }
  
  setTimeout(() => {
    console.log('🔄 準備關閉彈出視窗...')
    
    try {
      window.opener.postMessage(successData, window.location.origin)
    } catch (error) {
      console.warn('⚠️ 第二次消息發送失敗:', error)
    }
    
    window.close()
  }, 3000)
}

const handlePopupError = (error) => {
  const errorData = {
    type: 'LINEPAY_ERROR',
    error: error.message || '訂單載入失敗',
    orderId: route.query.orderId
  }
  
  console.log('📤 向主視窗發送錯誤消息:', errorData)
  
  try {
    window.opener.postMessage(errorData, window.location.origin)
  } catch (err) {
    console.error('❌ 錯誤消息發送失敗:', err)
  }
  
  setTimeout(() => {
    window.close()
  }, 3000)
}

async function loadOrderData() {
  try {
    let orderId = route.query.orderId || route.params.orderId
    
    if (!orderId) {
      const pendingOrder = sessionStorage.getItem('pendingOrder')
      if (pendingOrder) {
        try {
          const orderInfo = JSON.parse(pendingOrder)
          orderId = orderInfo.orderId
          console.log('📦 從 sessionStorage 獲取訂單 ID:', orderId)
          sessionStorage.removeItem('pendingOrder')
        } catch (e) {
          console.warn('⚠️ sessionStorage 數據解析失敗:', e)
        }
      }
    }
    
    if (!orderId && route.params.orderNumber) {
      orderId = route.params.orderNumber
      console.log('📦 使用 orderNumber 作為 ID:', orderId)
    }
    
    if (!orderId) {
      throw new Error('無法獲取訂單 ID，請檢查 URL 參數')
    }
    
    console.log('🔄 載入訂單詳情:', orderId)
    const response = await getOrderDetails(orderId)
    orderInfo.value = response.order
    
    if (orderInfo.value.paymentMethod === 'linepay') {
      console.log('✅ LINE Pay 訂單載入成功:', {
        orderNumber: orderInfo.value.orderNumber,
        transactionId: orderInfo.value.transactionId || orderInfo.value.paymentId,
        status: orderInfo.value.status
      })
    }
    
    console.log('✅ 訂單詳情載入完成')
  } catch (err) {
    orderInfo.value = null
    console.error('❌ 載入訂單失敗:', err)
    
    if (err.message.includes('404') || err.message.includes('找不到')) {
      throw new Error('找不到該訂單，請檢查訂單編號是否正確')
    } else if (err.message.includes('401') || err.message.includes('登入')) {
      throw new Error('登入已過期，請重新登入後查看訂單')
    } else {
      throw err
    }
  }
}

function formatDateTime(dateString) {
  if (!dateString) return '-';
  return dayjs(dateString).tz('Asia/Taipei').format('YYYY年MM月DD日 HH:mm');
}

function formatEventTime(dateString) {
  if (!dateString) return '-';
  return dayjs(dateString).tz('Asia/Taipei').format('MM月DD日 HH:mm');
}

function getStatusClass(status) {
  return (
    {
      pending: 'status-pending',
      paid: 'status-paid',
      confirmed: 'status-confirmed',
      cancelled: 'status-cancelled',
      refunded: 'status-refunded',
      expired: 'status-expired',
    }[status] || 'status-default'
  );
}

async function handleRetry() {
  retrying.value = true
  clearOrderError()
  try {
    await loadOrderData()
  } catch (error) {
    console.error('❌ 重試失敗:', error)
  } finally {
    retrying.value = false
  }
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('✅ 訂單編號已複製');
  } catch (err) {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showToast('✅ 訂單編號已複製');
    } catch {
      showToast('❌ 複製失敗，請手動複製');
    }
  }
}

function showToast(msg) {
  copyToast.value = msg;
  setTimeout(() => {
    copyToast.value = '';
  }, 2000);
}

function goToEvents() {
  router.push('/event');
}

function goToCart() {
  router.push('/cart');
}

function goToOrders() {
  router.push('/member/orders')
}

function shareOrder() {
  if (orderInfo.value) {
    const shareText = `我剛在 JoinBar 購買了活動票券！\n\n訂單編號：${orderInfo.value.orderNumber}\n活動數量：${orderInfo.value.items?.length || 0} 個\n\n快來一起參加吧！`
    
    if (navigator.share) {
      navigator.share({
        title: 'JoinBar 活動票券',
        text: shareText,
        url: window.location.href
      }).catch(err => {
        console.log('分享失敗:', err)
        fallbackShare(shareText)
      })
    } else {
      fallbackShare(shareText)
    }
  }
}

function fallbackShare(text) {
  try {
    navigator.clipboard.writeText(text)
    showToast('✅ 分享內容已複製到剪貼板')
  } catch {
    alert('請手動複製分享內容：\n\n' + text)
  }
}
</script>

<style scoped>
.popup-notice {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
}

.popup-content {
  text-align: center;
  padding: 48px 32px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  margin: 20px;
}

.popup-content .success-icon {
  font-size: 64px;
  margin-bottom: 24px;
}

.popup-content h2 {
  color: #1e40af;
  margin-bottom: 16px;
  font-size: 24px;
  font-weight: 700;
}

.popup-content p {
  color: #64748b;
  margin-bottom: 24px;
  line-height: 1.6;
}

.order-summary {
  background: #f8fafc;
  padding: 16px;
  border-radius: 8px;
  margin-top: 20px;
}

.order-summary p {
  margin: 8px 0;
  font-size: 14px;
  color: #1f2937;
}

.event-link {
  color: #1e40af;
  text-decoration: underline;
  cursor: pointer;
}
.event-link:hover {
  color: #2563eb;
}

.event-link-wrapper {
  text-decoration: none;
}

.event-name {
  color: #1f2937;
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
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

.payment-method {
  display: flex;
  align-items: center;
  gap: 8px;
}

.payment-icon {
  font-size: 16px;
}

.transaction-id {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  background: #f1f5f9;
  padding: 4px 8px;
  border-radius: 4px;
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

.linepay-notice {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  margin: 16px 0;
}

.notice-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.notice-content h3 {
  margin: 0 0 8px 0;
  color: #166534;
  font-size: 16px;
  font-weight: 600;
}

.notice-content p {
  margin: 4px 0;
  color: #15803d;
  font-size: 14px;
  line-height: 1.5;
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
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s;
}

.event-item:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}
 
.event-info {
  flex: 1;
}

.event-info h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.event-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
 
.event-meta {
  margin: 0;
  font-size: 13px;
  color: #64748b;
}
 
.event-price {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.price-label {
  font-size: 12px;
  color: #64748b;
}

.price-value {
  color: #dc2626;
  font-size: 18px;
  font-weight: 700;
}

.reminder-card {
  background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%);
  border: 1px solid #fde047;
}

.reminder-content ul {
  margin: 0;
  padding-left: 0;
  list-style: none;
}

.reminder-content li {
  margin: 12px 0;
  padding: 8px 0;
  color: #92400e;
  font-size: 14px;
  line-height: 1.5;
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

  .event-price {
    align-items: flex-start;
  }
  
  .action-buttons {
    flex-direction: column;
  }

  .copy-toast {
    left: 16px;
    right: 16px;
    bottom: 16px;
  }

  .linepay-notice {
    flex-direction: column;
    text-align: center;
  }
}
</style>
