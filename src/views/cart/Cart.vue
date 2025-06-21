<template>
  <div class="cart-container">
    <h2>購物車</h2>

    <div v-if="isLoading || cart.loading" class="loading-box">
      <div class="spinner"></div>
      <p>載入中，請稍候...</p>
    </div>

    <div v-else-if="cart.error" class="error-box">
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <span class="error-message">{{ cart.error }}</span>
      </div>
      <div class="error-actions">
        <button @click="handleRetry" class="retry-btn" :disabled="retrying">
          {{ retrying ? '重試中...' : '重試' }}
        </button>
        <button @click="clearError" class="dismiss-btn">關閉</button>
      </div>
    </div>

    <div v-else-if="cartItems.length === 0" class="empty-cart">
      <h3>購物車是空的</h3>
      <p class="empty-description">快去尋找喜歡的活動吧！</p>
      <button class="shop-btn" @click="goShopping">前往活動頁面</button>
    </div>

    <div v-else>
      <div class="cart-header">
        <div>商品</div>
        <div>單價</div>
        <div>數量</div>
        <div>小計</div>
        <div>操作</div>
      </div>

      <div v-for="item in cartItems" :key="item.id || item.eventId" class="cart-row">
        <div class="product">
          <img
            class="product-img"
            :src="item.imageUrl || item.image || 'https://placehold.co/80x80?text=No+Image'"
            :alt="item.name"
          />
          <div class="product-info">
            <p class="product-name">{{ item.name }}</p>
            <p class="product-bar" v-if="item.barName">{{ item.barName }}</p>
          </div>
        </div>

        <div class="price">${{ item.price }}</div>

        <div class="qty-box">
          <span>{{ item.quantity }}</span>
        </div>

        <div class="subtotal">${{ calcSubtotal(item) }}</div>

        <div class="actions">
          <button 
            @click="handleRemoveItem(item)" 
            class="remove-btn"
            :disabled="cart.loading"
          >
            {{ cart.loading ? '處理中...' : '刪除' }}
          </button>
        </div>
      </div>

      <div class="total-bar">
        <p class="total-label">
          總金額：<strong>${{ totalPrice }}</strong>
        </p>
        <button 
          class="checkout-btn" 
          @click="goToPayment"
          :disabled="cart.loading"
        >
          {{ cart.loading ? '處理中...' : '去買單' }}
        </button>
      </div>
    </div>

    <div v-if="successMessage" class="success-toast">
      {{ successMessage }}
    </div>
  </div>
</template>

<script setup>
import { useCartStore } from '@/stores/cartStore'
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const cart = useCartStore()
const router = useRouter()
const isLoading = ref(true)
const retrying = ref(false)
const successMessage = ref('')

onMounted(async () => {
  await loadCartData()
})

const loadCartData = async () => {
  try {
    isLoading.value = true
    await cart.loadCart()
    console.log('✅ 購物車載入成功')
  } catch (error) {
    console.error('❌ 購物車載入失敗:', error)
    
    if (error.message.includes('請先登入') || error.message.includes('登入已過期')) {
      const shouldLogin = confirm('您需要登入才能使用購物車同步功能。\n\n點擊「確定」前往登入頁面\n點擊「取消」使用本地購物車')
      if (shouldLogin) {
        router.push('/login')
        return
      }
    }
  } finally {
    isLoading.value = false
  }
}

const cartItems = computed(() => {
  const items = cart.items
  
  if (items && typeof items === 'object' && 'items' in items) {
    console.warn('⚠️ cart.items 是嵌套對象，使用 items.items')
    return Array.isArray(items.items) ? items.items : []
  }
  
  if (Array.isArray(items)) {
    return items
  }
  
  console.warn('⚠️ cart.items 格式異常:', items)
  return []
})

const totalPrice = computed(() => {
  try {
    const price = cart.totalPrice
    if (typeof price === 'number') {
      return price.toLocaleString()
    }
    return '0'
  } catch (error) {
    console.error('計算總價失敗:', error)
    return '0'
  }
})

const calcSubtotal = (item) => (item.price * item.quantity).toLocaleString()

const handleRemoveItem = async (item) => {
  try {
    const itemId = item.eventId || item.id
    const result = await cart.removeItem(itemId)
    
    if (result.success) {
      showSuccessMessage(result.message)
    }
  } catch (error) {
    alert('移除失敗：' + error.message)
  }
}

const handleRetry = async () => {
  retrying.value = true
  try {
    await loadCartData()
    clearError()
  } catch (error) {
    console.error('重試失敗:', error)
  } finally {
    retrying.value = false
  }
}

const clearError = () => {
  cart.error = null
}

const showSuccessMessage = (message) => {
  successMessage.value = message
  setTimeout(() => {
    successMessage.value = ''
  }, 3000)
}

const goToPayment = () => {
  if (cartItems.value.length === 0) {
    alert('購物車是空的')
    return
  }
  router.push('/payment')
}

const goShopping = () => {
  router.push('/event')
}
</script>

<style scoped>
* {
  font-size: revert;
  font-weight: revert;
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

.error-box {
  background-color: rgba(235, 150, 164, 0.1);
  border: 1px solid var(--color-text-warn, #eb96a4);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.error-content {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.error-icon {
  font-size: 20px;
}

.error-message {
  color: var(--color-text-warn, #eb96a4);
  font-weight: 500;
}

.error-actions {
  display: flex;
  gap: 12px;
}

.retry-btn, .dismiss-btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn {
  background-color: var(--color-select, #d17361);
  color: white;
  border: none;
}

.retry-btn:hover:not(:disabled) {
  background-color: #b85d4a;
}

.retry-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.dismiss-btn {
  background: transparent;
  color: var(--color-text-warn, #eb96a4);
  border: 1px solid var(--color-text-warn, #eb96a4);
}

.dismiss-btn:hover {
  background-color: rgba(235, 150, 164, 0.1);
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
  margin: 0 0 4px 0;
  color: var(--color-text-selected, #f5d1c0);
}

.product-bar {
  font-size: 14px;
  color: var(--color-text-unselected, #937e7e);
  margin: 0;
}

.qty-box {
  display: flex;
  justify-content: center;
  align-items: center;
}

.qty-box span {
  font-weight: 500;
}

.remove-btn {
  border: 1px solid var(--color-select, #d17361);
  background-color: transparent;
  color: var(--color-select, #d17361);
  padding: 6px 12px;
  font-size: 13px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.remove-btn:hover:not(:disabled) {
  background-color: var(--color-select, #d17361);
  color: white;
}

.remove-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  margin: 0;
}

.total-label strong {
  color: var(--color-text-selected, #f5d1c0);
}

.checkout-btn {
  background-color: var(--color-select, #d17361);
  color: white;
  border: none;
  padding: 10px 24px;
  font-size: 14px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.checkout-btn:hover:not(:disabled) {
  background-color: #b85d4a;
}

.checkout-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.empty-cart {
  text-align: center;
  padding: 80px 40px;
  color: var(--color-text-selected, #f5d1c0);
}

.empty-cart h3 {
  font-size: 24px;
  margin-bottom: 16px;
  color: var(--color-text-selected, #f5d1c0);
}

.empty-description {
  font-size: 16px;
  margin-bottom: 32px;
  color: var(--color-text-unselected, #937e7e);
  line-height: 1.5;
}

.shop-btn {
  background-color: var(--color-select, #d17361);
  color: white;
  border: none;
  padding: 12px 32px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.shop-btn:hover {
  background-color: #b85d4a;
}

.success-toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
</style>