<template>
  <div class="cart-container">
    <button class="btn btn-sm mb-4" @click="goBack">
      ← 返回購物車
    </button>
    <h2>付款資訊</h2>
 
    <div v-if="isLoading" class="loading-box">
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
 
      <div v-for="item in cartItems" :key="item.id" class="cart-row">
        <div class="product">
          <img 
            class="product-img" 
            :src="item.image || 'https://placehold.co/80x80'" 
            :alt="item.name"
          />
          <div class="product-info">
            <p class="product-name">{{ item.name }}</p>
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
              required
            />
            <span v-if="formErrors.name" class="error-text">{{ formErrors.name }}</span>
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
              required
            />
            <span v-if="formErrors.phone" class="error-text">{{ formErrors.phone }}</span>
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
              required
            />
            <span v-if="formErrors.email" class="error-text">{{ formErrors.email }}</span>
          </div>
        </div>
      </div>
 
      <div class="payment-method section-spacing">
        <h3>選擇付款方式</h3>
        
        <div class="payment-options">
          <button 
            class="btn bg-[#25c916] text-white border-[#25c916] payment-btn"
            :class="{ 'ring-2 ring-[#25c916] ring-offset-2': paymentMethod === 'linepay' }"
            @click="paymentMethod = 'linepay'"
          >
          <IconLine />
            LINE Pay
          </button>
 
          <button 
            class="btn bg-[#ffd4d4] text-black border-[#ffd4d4] payment-btn"
            :class="{ 'ring-2 ring-[#ffd4d4] ring-offset-2': paymentMethod === 'creditcard' }"
            @click="paymentMethod = 'creditcard'"
          >
          <IconCreditCard />  
            信用卡
          </button>
        </div>
 
        <div class="total-bar section-spacing">
          <p class="total-label">
            總金額：<strong>${{ totalPrice }}</strong>
          </p>
          <button 
            class="btn bg-[#860914] text-white checkout-btn"
            :class="{ 'btn-disabled': !canSubmit || isSubmitting || orderLoading }"
            :disabled="!canSubmit || isSubmitting || orderLoading" 
            @click="submitOrder"
          >
            <span v-if="isSubmitting || orderLoading" class="loading loading-spinner loading-sm"></span>
            {{ getSubmitButtonText() }}
          </button>
        </div>
      </div>
 
      <div v-if="orderError" class="error-message">
        <div class="error-content">
          <span class="error-icon">⚠️</span>
          <span>{{ orderError }}</span>
        </div>
        <button @click="clearOrderError" class="error-close">✕</button>
      </div>
    </div>
  </div>
 </template>
 
 <script setup>
 import { useCartStore } from '@/stores/cartStore'
 import { useOrder } from '@/composables/useOrder'
 import { computed, ref, onMounted, watch } from 'vue'
 import { useRouter } from 'vue-router'
 
 import IconLine from '@/components/icons/IconLine.vue'
 import IconCreditCard from '@/components/icons/IconCreditCard.vue'
 
 const cart = useCartStore()
 const router = useRouter()
 
 const { 
  createOrder, 
  confirmPayment, 
  simulatePayment,
  isLoading: orderLoading,
  error: orderError,
  clearError: clearOrderError
 } = useOrder()
 
 const paymentMethod = ref('')
 const isLoading = ref(true)
 const isSubmitting = ref(false)
 
 const customerInfo = ref({
  name: '',
  phone: '',
  email: ''
 })
 
 const formErrors = ref({})
 
 onMounted(async () => {
  setTimeout(() => {
    if (cart.items.length === 0) {
      alert('購物車是空的，即將返回購物車頁面')
      router.push('/cart')
      return
    }
    
    isLoading.value = false
  }, 400)
 })
 
 const cartItems = computed(() => cart.items)
 
 const calcSubtotal = (item) => (item.price * item.quantity).toLocaleString()
 
 const totalPrice = computed(() =>
  cartItems.value.reduce((acc, item) => acc + item.price * item.quantity, 0).toLocaleString(),
 )
 
 const canSubmit = computed(() => {
  return paymentMethod.value && 
         !isSubmitting.value && 
         !orderLoading.value &&
         isCustomerInfoValid.value &&
         cartItems.value.length > 0
 })
 
 const isCustomerInfoValid = computed(() => {
  const { name, phone, email } = customerInfo.value
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  return name.trim() && 
         phone.trim() && 
         email.trim() && 
         emailRegex.test(email)
 })
 
 const getSubmitButtonText = () => {
  if (isSubmitting.value || orderLoading.value) return '處理中...'
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
 
 function loadUserInfo() {
  try {
    const userInfo = localStorage.getItem('user_info')
    if (userInfo) {
      const user = JSON.parse(userInfo)
      customerInfo.value.name = user.username || user.lineDisplayName || ''
      customerInfo.value.email = user.email || ''
      console.log('✅ 用戶資訊已載入:', user.username || user.lineDisplayName)
    }
  } catch (error) {
    console.warn('⚠️ 載入用戶資訊失敗:', error)
  }
 }
 
 const submitOrder = async () => {
  if (isSubmitting.value || !canSubmit.value) return
 
  try {
    isSubmitting.value = true
 
    console.log('🔄 開始使用 useOrder 處理訂單...')
    
    await new Promise(resolve => setTimeout(resolve, 1500))
 
    if (paymentMethod.value === 'linepay') {
      alert(`🟢 LINE Pay 模擬付款 (使用 useOrder)\n\n即將整合完整 API 流程`)
    } else if (paymentMethod.value === 'creditcard') {
      alert(`💳 信用卡模擬付款 (使用 useOrder)\n\n即將整合完整 API 流程`)
    }
 
    const mockOrderNumber = `ORDER-${Date.now().toString().slice(-6)}`
    const mockOrderId = Date.now().toString()
    
    cart.clearCart()
    router.push(`/order-success/${mockOrderNumber}?orderId=${mockOrderId}`)
 
  } catch (error) {
    console.error('模擬付款錯誤:', error)
    alert('模擬付款失敗，請重新嘗試')
  } finally {
    isSubmitting.value = false
  }
 }
 
 const goBack = () => {
  router.push('/cart')
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
  background-color: #fff;
  border-radius: 20px;
  box-shadow: 0 0 16px rgba(0, 0, 0, 0.05);
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
  border-top: 4px solid #860914;
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
  border-bottom: 1px solid #ddd;
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
 }
 
 .cart-row:hover {
  background-color: #fafafa;
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
  transition: all 0.2s;
 }
 
 .payment-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
 }
 
 .checkout-btn {
  font-size: 14px;
  padding: 10px 24px;
  transition: all 0.2s ease-in-out;
 }
 
 .checkout-btn:hover:not(.btn-disabled) {
  background-color: #a50b18;
  border-color: #a50b18;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(134, 9, 20, 0.3);
 }
 
 .checkout-btn:active:not(.btn-disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(134, 9, 20, 0.25);
 }
 
 .checkout-btn.btn-disabled {
  cursor: not-allowed;
 }
 
 .error-message {
  background-color: #fee2e2;
  border: 1px solid #fecaca;
  color: #991b1b;
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
  color: #991b1b;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
 }
 
 .error-close:hover {
  background-color: rgba(153, 27, 27, 0.1);
 }
 
 .customer-section h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
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
  color: #333;
 }
 
 .form-input {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
 }
 
 .form-input:focus {
  outline: none;
  border-color: #860914;
  box-shadow: 0 0 0 2px rgba(134, 9, 20, 0.1);
 }
 
 .form-input.input-error {
  border-color: #dc2626;
  box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.1);
 }
 
 .error-text {
  color: #dc2626;
  font-size: 12px;
  margin-top: 4px;
 }
 
 .section-spacing {
  margin-top: 32px;
 }
 
 @media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
 }
 </style>