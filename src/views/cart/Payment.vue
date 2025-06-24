<template>
  <div class="cart-container">
    <button
      class="btn btn-sm mb-4"
      @click="goBack">
      ← 返回購物車
    </button>
    <h2>{{ isRetryMode ? '為訂單繼續付款' : '付款資訊' }}</h2>

    <div
      v-if="isLoading"
      class="loading-box">
      <div class="spinner"></div>
      <p>載入中，請稍候...</p>
    </div>

    <div v-else>
      <div class="cart-header">
        <div>活動</div>
        <div>單價</div>
        <div>數量</div>
        <div>小計</div>
      </div>

      <div
        v-for="item in displayItems"
        :key="item.id || item.eventId"
        class="cart-row">
        <div class="product">
          <img
            class="product-img"
            :src="item.image || item.imageUrl || 'https://placehold.co/80x80'"
            :alt="item.name || item.eventName" />
          <div class="product-info">
            <p class="product-name">{{ item.name || item.eventName }}</p>
          </div>
        </div>

        <div class="price">${{ item.price }}</div>
        <div class="quantity text-center">{{ item.quantity }}</div>
        <div class="subtotal">${{ calcSubtotal(item) }}</div>
      </div>

      <div class="customer-section section-spacing">
        <h3>客戶資訊</h3>
        <div class="form-grid">
          <div class="form-group">
            <label for="customerName">姓名 *</label>
            <input
              id="customerName"
              v-model="customerInfo.name"
              type="text"
              class="form-input"
              :class="{ 'input-error': formErrors.name }"
              placeholder="請輸入您的姓名"
              required />
            <span
              v-if="formErrors.name"
              class="error-text"
              >{{ formErrors.name }}</span
            >
          </div>

          <div class="form-group">
            <label for="customerPhone">電話 *</label>
            <input
              id="customerPhone"
              v-model="customerInfo.phone"
              type="tel"
              class="form-input"
              :class="{ 'input-error': formErrors.phone }"
              placeholder="請輸入您的電話號碼"
              required />
            <span
              v-if="formErrors.phone"
              class="error-text"
              >{{ formErrors.phone }}</span
            >
          </div>

          <div class="form-group">
            <label for="customerEmail">電子郵件 *</label>
            <input
              id="customerEmail"
              v-model="customerInfo.email"
              type="email"
              class="form-input"
              :class="{ 'input-error': formErrors.email }"
              placeholder="請輸入您的電子郵件"
              required />
            <span
              v-if="formErrors.email"
              class="error-text"
              >{{ formErrors.email }}</span
            >
          </div>
        </div>
      </div>

      <div class="payment-method section-spacing">
        <h3>選擇付款方式</h3>

        <div class="payment-options">
          <button 
            class="payment-btn linepay-btn"
            :class="{ 'selected': paymentMethod === 'linepay' }"
            @click="paymentMethod = 'linepay'"
          >
            <IconLine />
            LINE Pay
          </button>
 
          <button 
            class="payment-btn creditcard-btn"
            :class="{ 'selected': paymentMethod === 'creditcard' }"
            @click="paymentMethod = 'creditcard'"
          >
            <IconCreditCard />  
            信用卡
          </button>
        </div>

        <div
          v-if="paymentMethodError"
          class="payment-error">
          {{ paymentMethodError }}
        </div>

        <div class="total-bar section-spacing">
          <p class="total-label">
            總金額：<strong>${{ totalPrice }}</strong>
          </p>
          <button 
            class="checkout-btn"
            :class="{ 'btn-disabled': !canSubmit || isSubmitting || orderLoading }"
            :disabled="!canSubmit || isSubmitting || orderLoading"
            @click="submitOrder">
            <span
              v-if="isSubmitting || orderLoading"
              class="loading loading-spinner loading-sm"></span>
            {{ getSubmitButtonText() }}
          </button>
        </div>
      </div>
 
      <div v-if="errorMessage || orderError || linePayError" class="error-message">
        <div class="error-content">
          <span class="error-icon">⚠️</span>
          <span>{{ errorMessage || orderError || linePayError }}</span>
        </div>
        <button
          @click="clearAllErrors"
          class="error-close">
          ✕
        </button>
      </div>
    </div>
  </div>
 </template>
 
 <script setup>
import { useCartStore } from '@/stores/cartStore'
import { useOrder } from '@/composables/useOrder'
import { useLinePay } from '@/composables/useLinePay'
import { computed, ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

import IconLine from '@/components/icons/IconLine.vue'
import IconCreditCard from '@/components/icons/IconCreditCard.vue'

dayjs.extend(utc)
dayjs.extend(timezone)

const cart = useCartStore()
const router = useRouter()
const route = useRoute()

const { 
 createOrder, 
 confirmPayment, 
 simulatePayment,
 getOrderDetails, 
 isLoading: orderLoading,
 error: orderError,
 clearError: clearOrderError
} = useOrder()

const { 
 createLinePayment, 
 isLoading: linePayLoading,
 error: linePayError,
 clearState: clearLinePayState
} = useLinePay()

const paymentMethod = ref('')
const isLoading = ref(true)
const isSubmitting = ref(false)

const isRetryMode = ref(false)
const retryOrderId = ref(null)
const displayItems = ref([]) 

const errorMessage = ref('')
const paymentMethodError = ref('')

const customerInfo = ref({
 name: '',
 phone: '',
 email: ''
})

const formErrors = ref({})

onMounted(async () => {
  isLoading.value = true;
  retryOrderId.value = route.query.retryOrderId;

  try {
    if (retryOrderId.value) {
      isRetryMode.value = true;
      console.log(`🔄 進入繼續付款模式，訂單 ID: ${retryOrderId.value}`);
      const response = await getOrderDetails(retryOrderId.value);
      
      displayItems.value = response.order.items.map(item => ({
        ...item,
        id: item.eventId, 
        name: item.eventName,
      }));
      
      const orderUser = response.order.user;
      if(orderUser) {
        customerInfo.value.name = orderUser.name;
        customerInfo.value.email = orderUser.email;
        customerInfo.value.phone = orderUser.phone;
      } else {
        loadUserInfo(); 
      }

    } else {
      isRetryMode.value = false;
      if (cart.items.length === 0) {
        await cart.loadCart();
      }
      if (cart.items.length === 0) {
        alert('購物車是空的，即將返回購物車頁面');
        router.push('/cart');
        return;
      }
      displayItems.value = cart.items;
      loadUserInfo(); 
    }

  } catch (error) {
    console.error('❌ 載入付款頁面時發生錯誤:', error);
    errorMessage.value = `載入資料失敗: ${error.message}`;
  } finally {
    isLoading.value = false;
  }
});

const calcSubtotal = (item) => (item.price * item.quantity).toLocaleString()

const totalPrice = computed(() =>
  displayItems.value.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 1), 0).toLocaleString(),
)

const canSubmit = computed(() => {
 return paymentMethod.value && 
        !isSubmitting.value && 
        !orderLoading.value &&
        !linePayLoading.value &&
        isCustomerInfoValid.value &&
        displayItems.value.length > 0
})

const isCustomerInfoValid = computed(() => {
 const { name, phone, email } = customerInfo.value
 const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
 
 return name && name.trim() && 
        phone && phone.trim() && 
        email && email.trim() && 
        emailRegex.test(email)
})

const getSubmitButtonText = () => {
 if (isSubmitting.value || orderLoading.value || linePayLoading.value) return '處理中...'
 if (!paymentMethod.value) return '請選擇付款方式'
 if (!isCustomerInfoValid.value) return '請完成客戶資訊'
 return '確認付款'
}

watch(() => customerInfo.value.name, () => {
 if (formErrors.value.name) delete formErrors.value.name
})

watch(() => customerInfo.value.phone, () => {
 if (formErrors.value.phone) delete formErrors.value.phone
})

watch(() => customerInfo.value.email, () => {
 if (formErrors.value.email) delete formErrors.value.email
})

watch(() => paymentMethod.value, () => {
 paymentMethodError.value = ''
})

function loadUserInfo() {
 try {
   const userInfo = localStorage.getItem('user')
   if (userInfo) {
     const user = JSON.parse(userInfo)
     customerInfo.value.name = customerInfo.value.name || user.username || user.lineDisplayName || ''
     customerInfo.value.email = customerInfo.value.email || user.email || ''
   }
 } catch (error) {
   console.warn('⚠️ 載入用戶資訊失敗:', error)
 }
}

const submitOrder = async () => {
  if (isSubmitting.value || !canSubmit.value) return;

  try {
    isSubmitting.value = true;
    clearAllErrors();

    if (!validateForm()) {
      isSubmitting.value = false;
      return;
    }

    let orderIdToPay, orderToPay;

    if (isRetryMode.value) {
      console.log(`🔄 為訂單 ${retryOrderId.value} 繼續付款`);
      orderIdToPay = retryOrderId.value;
      const response = await getOrderDetails(orderIdToPay);
      orderToPay = response.order;
    } else {
      console.log('🔄 開始建立新訂單...');
      const orderData = {
        items: displayItems.value.map(item => ({
          eventId: item.id,
          quantity: 1
        })),
        paymentMethod: paymentMethod.value
      };
      const orderResponse = await createOrder(orderData);
      orderToPay = orderResponse.order;
      orderIdToPay = orderToPay.id || orderToPay.orderId;
      
      if (!orderIdToPay) {
        throw new Error('訂單 ID 格式錯誤');
      }
      console.log(`✅ 新訂單創建成功: ${orderIdToPay}`);
    }

    if (paymentMethod.value === 'linepay') {
      console.log(`🔄 處理訂單 ${orderIdToPay} 的 LINE Pay 付款...`);
      const paymentResult = await createLinePayment(orderIdToPay);
      
      console.log('🔄 準備跳轉到 LINE Pay...');
      
      if (!isRetryMode.value) {
        await cart.clearCart();
      }
      
      window.location.href = paymentResult.paymentUrl;
      
    } else {
      console.log(`🔄 處理訂單 ${orderIdToPay} 的模擬付款...`);
      const paymentData = { paymentMethod: paymentMethod.value, orderData: orderToPay };
      const paymentResult = await simulatePayment(paymentData);
      
      await confirmPayment(orderIdToPay, paymentResult);
      
      showPaymentSuccessMessage(orderToPay, paymentResult);
      
      if (!isRetryMode.value) {
        await cart.clearCart();
      }
      
      router.push({
        name: 'OrderSuccess',
        params: { orderNumber: orderToPay.orderNumber },
        query: { orderId: orderIdToPay }
      });
    }

  } catch (error) {
    console.error('❌ 訂單提交失敗:', error);
    handleSubmitError(error);
  } finally {
    if (paymentMethod.value !== 'linepay') {
      isSubmitting.value = false;
    }
  }
};

function validateForm() {
 formErrors.value = {}
 
 if (!customerInfo.value.name.trim()) {
   formErrors.value.name = '請輸入姓名'
 }
 
 if (!customerInfo.value.phone.trim()) {
   formErrors.value.phone = '請輸入電話號碼'
 }
 
 if (!customerInfo.value.email.trim()) {
   formErrors.value.email = '請輸入電子郵件'
 } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.value.email)) {
   formErrors.value.email = '電子郵件格式不正確'
 }
 
 if (!paymentMethod.value) {
   paymentMethodError.value = '請選擇付款方式'
   return false
 }
 
 if (Object.keys(formErrors.value).length > 0) {
   setError('請修正表單錯誤')
   return false
 }

 return true
}

function showPaymentSuccessMessage(order, paymentResult) {
 const paymentMethodName = paymentMethod.value === 'linepay' ? 'LINE Pay' : '信用卡'
 const amount = totalPrice.value
 
 if (paymentMethod.value === 'creditcard') {
   alert(`💳 ${paymentMethodName} 模擬付款成功！\n\n訂單編號：${order.orderNumber}\n金額：${amount}\n付款ID：${paymentResult.paymentId}\n\n點擊確定前往訂單詳情`)
 }
}

function handleSubmitError(error) {
 let errorMsg = '訂單提交失敗，請重新嘗試'
 
 if (error.message.includes('登入已過期') || error.message.includes('認證')) {
   errorMsg = '登入已過期，請重新登入'
   localStorage.removeItem('access_token')
   localStorage.removeItem('user')
   setTimeout(() => router.push('/login'), 1500)
 } else if (error.message.includes('已滿員')) {
   errorMsg = error.message + '，請重新選擇活動'
 } else if (error.message.includes('已結束') || error.message.includes('過期')) {
   errorMsg = error.message + '，請移除過期活動'
 } else if (error.message.includes('重複')) {
   errorMsg = error.message
 } else if (error.message.includes('網路') || error.message.includes('請求失敗')) {
   errorMsg = '網路連線有問題，請檢查網路後重試'
 } else if (error.message) {
   errorMsg = error.message
 }
 
 setError(errorMsg)
}

function setError(message) {
 errorMessage.value = message
}

function clearAllErrors() {
 errorMessage.value = ''
 clearOrderError()
 clearLinePayState()
 formErrors.value = {}
 paymentMethodError.value = ''
}

const goBack = () => {
  if (isRetryMode.value) {
    router.go(-1); 
  } else {
    router.push('/cart'); 
  }
}
</script>
 
 <style scoped>
 * {
  font-size: revert ;
  font-weight: revert ;
 }
 
 .cart-container {
  max-width: 1280px;
  margin: 48px auto;
  padding: 40px;
  background-color: var(--color-black, #1a1a1a);
  border-radius: 20px;
  box-shadow: 0 0 16px rgba(0, 0, 0, 0.05);
  font-size: 15px;
 }

 .cart-container h2 {
  color: var(--color-text-selected, #f5d1c0);
  margin-bottom: 32px;
 }
 
 .loading-box {
  text-align: center;
  padding: 48px 0;
  color: var(--color-text-selected, #f5d1c0);
 }
 
 .spinner {
  margin: 16px auto;
  width: 40px;
  height: 40px;
  border: 4px solid #eee;
  border-top: 4px solid var(--color-select, #d17361);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.cart-header {
  display: flex;
  padding: 16px 0;
  font-weight: bold;
  border-bottom: 1px solid var(--color-icon-secondary, #bcaea4);
  color: var(--color-text-selected, #f5d1c0);
 }
 
 .cart-header > div {
  flex: 1;
  text-align: center;
}

.cart-header > div:first-child {
  flex: 2;
  text-align: left;
}

.cart-row {
  display: flex;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #eee;
  color: var(--color-text-selected, #f5d1c0);
 }
 
 .cart-row:hover {
  background-color: rgba(245, 209, 192, 0.05);
 }
 
 .cart-row > div {
  flex: 1;
  text-align: center;
}

.cart-row > div:first-child {
  flex: 2;
  text-align: left;
}

.product {
  display: flex;
  align-items: center;
  gap: 16px;
}

.product-img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
  background-color: #f0f0f0;
}

.product-name {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: var(--color-text-selected, #f5d1c0);
 }
 
 .total-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 32px;
  gap: 16px;
}

.total-label {
  font-size: 19px;
  color: var(--color-text-selected, #f5d1c0);
 }
 
 .payment-method {
  font-size: 15px;
  margin-top: 16px;
}

.payment-options {
  display: flex;
  gap: 16px;
  margin-top: 16px;
}

.payment-btn {
  padding: 12px 20px;
  font-size: 16px;
  font-weight: 500;
  height: auto;
  min-height: 60px;
  width: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 6px;
  border: 2px solid;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
 }

 .payment-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
 }

 .linepay-btn {
  background-color: var(--color-line-green, #25c916);
  color: white;
  border-color: var(--color-line-green, #25c916);
 }

 .linepay-btn:hover {
  background-color: var(--color-line-green-dark, #20b012);
  border-color: var(--color-line-green-dark, #20b012);
 }

 .linepay-btn.selected {
  box-shadow: 0 0 0 2px var(--color-line-green, #25c916), 
              0 0 0 4px rgba(37, 201, 22, 0.2);
 }

 .creditcard-btn {
  background-color: var(--color-creditcard, #ffd4d4);
  color: var(--color-creditcard-text, #333);
  border-color: var(--color-creditcard, #ffd4d4);
 }

 .creditcard-btn:hover {
  background-color: #ffcaca;
  border-color: #ffcaca;
 }

 .creditcard-btn.selected {
  box-shadow: 0 0 0 2px var(--color-creditcard, #ffd4d4), 
              0 0 0 4px rgba(255, 212, 212, 0.3);
 }
 
 .checkout-btn {
  background-color: var(--color-select, #d17361);
  color: white;
  border: 2px solid var(--color-select, #d17361);
  font-size: 16px;
  font-weight: 500;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  white-space: nowrap;
 }
 
 .checkout-btn:hover:not(.btn-disabled) {
  background-color: var(--color-select-dark, #b85d4a);
  border-color: var(--color-select-dark, #b85d4a);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(209, 115, 97, 0.3);
 }
 
 .checkout-btn:active:not(.btn-disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(209, 115, 97, 0.25);
 }
 
 .checkout-btn.btn-disabled {
  background-color: var(--color-icon-secondary, #bcaea4);
  border-color: var(--color-icon-secondary, #bcaea4);
  color: var(--color-text-unselected, #937e7e);
  cursor: not-allowed;
  opacity: 0.7;
  transform: none;
  box-shadow: none;
 }
 
 .error-message {
  background-color: rgba(235, 150, 164, 0.1);
  border: 1px solid var(--color-text-warn, #eb96a4);
  color: var(--color-text-warn, #eb96a4);
  padding: 16px;
  border-radius: 8px;
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.error-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.error-icon {
  font-size: 18px;
}

.error-close {
  background: none;
  border: none;
  color: var(--color-text-warn, #eb96a4);
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
 }
 
 .error-close:hover {
  background-color: rgba(235, 150, 164, 0.1);
 }
 
 .customer-section h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--color-text-selected, #f5d1c0);
 }

 .payment-method h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--color-text-selected, #f5d1c0);
 }
 
 .form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
  color: var(--color-text-selected, #f5d1c0);
 }
 
 .form-input {
  padding: 10px 12px;
  border: 1px solid var(--color-icon-secondary, #bcaea4);
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
  background-color: rgba(245, 209, 192, 0.05);
  color: var(--color-text-selected, #f5d1c0);
 }

 .form-input::placeholder {
  color: var(--color-text-unselected, #937e7e);
 }
 
 .form-input:focus {
  outline: none;
  border-color: var(--color-select, #d17361);
  box-shadow: 0 0 0 2px rgba(209, 115, 97, 0.2);
 }
 
 .form-input.input-error {
  border-color: var(--color-text-warn, #eb96a4);
  box-shadow: 0 0 0 2px rgba(235, 150, 164, 0.2);
 }
 
 .error-text {
  color: var(--color-text-warn, #eb96a4);
  font-size: 12px;
  margin-top: 4px;
 }
 
 .payment-error {
  color: var(--color-text-warn, #eb96a4);
  font-size: 14px;
  margin-top: 12px;
  padding: 8px 12px;
  background: rgba(235, 150, 164, 0.1);
  border-radius: 6px;
  border: 1px solid var(--color-text-warn, #eb96a4);
 }
 
 .section-spacing {
  margin-top: 32px;
 }

 .btn {
  background: transparent;
  border: 1px solid var(--color-icon-secondary, #bcaea4);
  color: var(--color-text-selected, #f5d1c0);
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
 }

 .btn:hover {
  background: var(--color-icon-secondary, #bcaea4);
  color: var(--color-black, #1a1a1a);
 }
 
 @media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
 }
 </style>
