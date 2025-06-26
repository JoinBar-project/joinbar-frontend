<template>
  <div class="payment-waiting-container">
    <div class="waiting-content">
      <div v-if="isChecking" class="checking-section">
        <div class="spinner-large"></div>
        <h2>正在確認付款狀態</h2>
        <p class="waiting-description">
          請稍候，我們正在確認您的付款...
        </p>
      </div>

      <div v-else-if="paymentStatus === 'success'" class="success-section">
        <div class="success-icon">✅</div>
        <h2>付款確認成功！</h2>
        <p>您的訂單已確認，正在跳轉到訂單詳情...</p>
        <div class="order-info" v-if="orderData">
          <p><strong>訂單編號：</strong>{{ orderData.orderNumber }}</p>
          <p><strong>付款金額：</strong>${{ formatAmount(orderData.totalAmount) }}</p>
        </div>
      </div>

      <div v-else-if="paymentStatus === 'pending'" class="pending-section">
        <div class="pending-icon">⏳</div>
        <h2>訂單待確認</h2>
        <p>您的訂單正在處理中，可能需要一些時間</p>
        
        <div class="order-info" v-if="orderData">
          <p><strong>訂單編號：</strong>{{ orderData.orderNumber }}</p>
          <p><strong>金額：</strong>${{ formatAmount(orderData.totalAmount) }}</p>
          <p><strong>狀態：</strong>{{ getStatusText(orderData.status) }}</p>
        </div>
        
        <div class="action-buttons">
          <button @click="checkAgain" class="btn-retry" :disabled="isChecking">
            重新檢查
          </button>
          <button @click="goToOrders" class="btn-orders">
            查看我的訂單
          </button>
        </div>
      </div>

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
        </div>
      </div>

      <div v-else-if="paymentStatus === 'timeout'" class="timeout-section">
        <div class="timeout-icon">⏰</div>
        <h2>付款狀態確認超時</h2>
        <p>請稍後查看訂單狀態，或重新檢查。</p>
        <div class="action-buttons">
          <button @click="retryCheck" class="btn-retry" :disabled="isChecking">
            重新檢查
          </button>
          <button @click="goToOrders" class="btn-orders">
            查看我的訂單
          </button>
        </div>
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
const { getOrderDetails, formatAmount, getOrderDetailsByNumber, getStatusText } = useOrder()

const isChecking = ref(true)
const paymentStatus = ref('checking')
const errorMessage = ref('')
const orderData = ref(null)

onMounted(async () => {
  if (window.opener) {
    const result = {
      success: true,
      orderId: route.query.orderId,
      orderNumber: route.query.orderNumber || 'unknown',
      message: '付款處理中'
    };
    
    localStorage.setItem('linepay-result', JSON.stringify(result));
    
    document.body.innerHTML = '<div style="text-align:center;margin-top:100px;font-size:24px;">✅ 付款成功！視窗即將關閉...</div>';
    
    setTimeout(() => window.close(), 1500);
    return;
  }

  const orderId = route.query.orderId;
  
  console.log('🔄 PaymentWaiting 啟動:', { orderId });
  
  if (!orderId) {
    paymentStatus.value = 'failed';
    errorMessage.value = '缺少訂單 ID';
    isChecking.value = false;
    return;
  }

  await checkOrderStatus(orderId);
});

const checkOrderStatus = async (orderId) => {
  try {
    isChecking.value = true;
    paymentStatus.value = 'checking';
    
    console.log(`🔍 檢查訂單狀態: ${orderId}`);
    
    let response;
    
    if (orderId.includes('ORDER-')) {
      console.log('📋 使用 orderNumber 查詢');
      response = await getOrderDetailsByNumber(orderId);
    } else {
      console.log('🔢 使用 ID 查詢');
      response = await getOrderDetails(orderId);
    }
    
    const order = response.order;
    orderData.value = order;
    
    console.log(`📊 訂單狀態: ${order.status}`);
    
    if (['confirmed', 'paid'].includes(order.status)) {
      console.log('✅ 付款確認成功！');
      paymentStatus.value = 'success';
      
      setTimeout(() => {
        console.log('🔄 跳轉到訂單成功頁面...');
        router.replace({
          name: 'OrderSuccess',
          params: { orderNumber: order.orderNumber },
          query: { orderId: order.id || order.orderId }
        });
      }, 1500);
      
    } else if (order.status === 'pending') {
      console.log('⏳ 訂單仍在待確認狀態');
      paymentStatus.value = 'pending';
      
    } else if (['cancelled', 'expired', 'refunded'].includes(order.status)) {
      paymentStatus.value = 'failed';
      errorMessage.value = `訂單${order.status === 'cancelled' ? '已取消' : order.status === 'expired' ? '已過期' : '已退款'}`;
      
    } else {
      paymentStatus.value = 'failed';
      errorMessage.value = `未知的訂單狀態: ${order.status}`;
    }
    
  } catch (error) {
    console.error('❌ 檢查訂單狀態失敗:', error);
    paymentStatus.value = 'failed';
    errorMessage.value = error.message || '無法獲取訂單狀態';
  } finally {
    isChecking.value = false;
  }
};

const checkAgain = async () => {
  const orderId = route.query.orderId;
  if (orderId) {
    await checkOrderStatus(orderId);
  }
};

const retryCheck = async () => {
  const orderId = route.query.orderId;
  if (orderId) {
    await checkOrderStatus(orderId);
  }
};

const goToPayment = () => {
  router.push('/payment');
};

const goToOrders = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    router.push({ name: 'MemberOrderRecords', params: { id: user.id } });
  } catch {
    router.push('/login');
  }
};
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
}

.checking-section h2,
.success-section h2,
.failed-section h2,
.timeout-section h2,
.pending-section h2 {
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

.success-icon,
.failed-icon,
.timeout-icon,
.pending-icon {
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
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 24px;
}

.btn-retry,
.btn-back,
.btn-orders {
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  font-size: 14px;
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

.btn-orders {
  background: #3b82f6;
  color: white;
}

.btn-orders:hover {
  background: #2563eb;
}

.error-message {
  color: #dc2626;
  font-weight: 500;
  margin: 16px 0;
}

.pending-section {
  color: #d97706;
}

.pending-icon {
  font-size: 64px;
  margin-bottom: 16px;
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