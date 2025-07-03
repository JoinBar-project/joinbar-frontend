<template>
  <div class="cart-container">
    <div class="flex gap-2">
      <h2 class="inline-flex gap-2 text-lg font-semibold">購物車</h2>
      <img src="/cart.png" alt="Cart Icon" class="w-8 h-8" />
    </div>

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
      <div class="desktop-layout">
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
      </div>

      <div class="mobile-layout">
        <div v-for="item in cartItems" :key="item.id || item.eventId" class="cart-card">
          <div class="card-header">
            <img
              class="product-img-mobile"
              :src="item.imageUrl || item.image || 'https://placehold.co/60x60?text=No+Image'"
              :alt="item.name"
            />
            <div class="product-info-mobile">
              <h4 class="product-name-mobile">{{ item.name }}</h4>
              <p class="product-bar-mobile" v-if="item.barName">{{ item.barName }}</p>
            </div>
            <button 
              @click="handleRemoveItem(item)" 
              class="remove-btn-mobile"
              :disabled="cart.loading"
              :title="'移除 ' + item.name"
            >
              <i class="fa-solid fa-trash-can remove-icon"></i>

            </button>
          </div>
          
          <div class="card-details">
            <div class="detail-row">
              <span class="detail-label">單價</span>
              <span class="detail-value">${{ item.price }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">數量</span>
              <span class="detail-value">{{ item.quantity }}</span>
            </div>
            <div class="detail-row total-row">
              <span class="detail-label">小計</span>
              <span class="detail-value total-value">${{ calcSubtotal(item) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="total-section">
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
    </div>

    <div v-if="successMessage" class="success-toast">
      {{ successMessage }}
    </div>

    <BaseAlertModal
      :visible="alertModal.visible"
      :title="alertModal.title"
      :message="alertModal.message"
      :type="alertModal.type"
      :confirm-text="alertModal.confirmText"
      @close="alertModal.visible = false"
    />
    
    <BaseConfirmModal
      :visible="confirmModal.visible"
      :title="confirmModal.title"
      :message="confirmModal.message"
      :type="confirmModal.type"
      :confirm-text="confirmModal.confirmText"
      :cancel-text="confirmModal.cancelText"
      @confirm="confirmModal.onConfirm"
      @cancel="confirmModal.onCancel"
    />
  </div>
</template>

<script setup>
import { useCartStore } from '@/stores/cartStore'
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import BaseAlertModal from '@/components/common/BaseAlertModal.vue'
import BaseConfirmModal from '@/components/common/BaseConfirmModal.vue'

const cart = useCartStore()
const router = useRouter()
const isLoading = ref(true)
const retrying = ref(false)
const successMessage = ref('')

const alertModal = ref({
  visible: false,
  title: '',
  message: '',
  type: 'default',
  confirmText: '確認'
})

const confirmModal = ref({
  visible: false,
  title: '',
  message: '',
  type: null,
  confirmText: '確認',
  cancelText: '取消',
  onConfirm: null,
  onCancel: null
})

const showAlert = (title, message, type = 'default', confirmText = '確認') => {
  alertModal.value = { visible: true, title, message, type, confirmText }
}

const showConfirm = (title, message, type = null, confirmText = '確認', cancelText = '取消') => {
  return new Promise((resolve) => {
    confirmModal.value = {
      visible: true,
      title,
      message,
      type,
      confirmText,
      cancelText,
      onConfirm: () => {
        confirmModal.value.visible = false
        resolve(true)
      },
      onCancel: () => {
        confirmModal.value.visible = false
        resolve(false)
      }
    }
  })
}

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
      const shouldLogin = await showConfirm(
        '需要登入',
        '您需要登入才能使用購物車同步功能。\n\n點擊「確定」前往登入頁面\n點擊「取消」使用本地購物車',
        'question',
        '確定',
        '取消'
      )
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
  const confirmed = await showConfirm(
    '確認移除',
    `確定要移除「${item.name}」嗎？`,
    'warning',
    '移除',
    '取消'
  )
  
  if (!confirmed) return
  
  try {
    const itemId = item.eventId || item.id
    const result = await cart.removeItem(itemId)
    
    if (result.success) {
      showSuccessMessage(result.message)
    }
  } catch (error) {
    showAlert('移除失敗', error.message, 'error')
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
    showAlert('無法結帳', '購物車是空的', 'warning')
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
  color: var(--color-primary-orange);
  margin-bottom: 32px;
}

.loading-box {
  text-align: center;
  padding: 48px 0;
  color: var(--color-primary-orange);
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

.desktop-layout {
  display: block;
}

.mobile-layout {
  display: none;
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

.total-section {
  margin-top: 32px;
}

.total-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 16px;
}

.total-label {
  font-size: 19px;
  color: var(--color-main-text);
  margin: 0;
}

.total-label strong {
  color: var(--color-text-selected, #f5d1c0);
}

.checkout-btn {
  background-color: var(--color-secondary-green);
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
  color: var(--color-main-text);
}

.empty-description {
  font-size: 16px;
  margin-bottom: 32px;
  color: var(--color-text-unselected);
  line-height: 1.5;
}

.shop-btn {
  background-color: var(--color-secondary-green);
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
  background-color: var(--color-primary-orange);
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

@media (max-width: 767px) {
  .cart-container {
    margin: 20px 16px;
    padding: 20px;
    border-radius: 16px;
  }

  .cart-container h2 {
    font-size: 20px;
    margin-bottom: 20px;
  }

  .desktop-layout {
    display: none;
  }

  .mobile-layout {
    display: block;
  }

  .cart-card {
    background: rgba(245, 209, 192, 0.05);
    border: 1px solid var(--color-icon-secondary, #bcaea4);
    border-radius: 12px;
    margin-bottom: 16px;
    overflow: hidden;
  }

  .card-header {
    display: flex;
    align-items: center;
    padding: 16px;
    gap: 12px;
  }

  .product-img-mobile {
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: 8px;
    background-color: #f0f0f0;
    flex-shrink: 0;
  }

  .product-info-mobile {
    flex: 1;
    min-width: 0;
  }

  .product-name-mobile {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 4px 0;
    color: var(--color-text-selected, #f5d1c0);
    line-height: 1.3;
  }

  .product-bar-mobile {
    font-size: 13px;
    color: var(--color-text-unselected, #937e7e);
    margin: 0;
  }

  .remove-btn-mobile {
    background: none;
    border: none;
    padding: 8px;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.2s ease;
    flex-shrink: 0;
    min-height: 44px;
    min-width: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-warn, #eb96a4);
  }

  .remove-btn-mobile:hover:not(:disabled) {
    background-color: rgba(235, 150, 164, 0.15);
    color: #d73847;
    transform: scale(1.05);
  }

  .remove-btn-mobile:active {
    transform: scale(0.95);
  }

  .remove-btn-mobile:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .remove-icon {
    font-size: 16px;
    transition: all 0.2s ease;
  }

  .remove-btn-mobile:hover:not(:disabled) .remove-icon {
    transform: translateY(-1px);
  }

  .remove-icon-svg {
    width: 18px;
    height: 18px;
    transition: all 0.2s ease;
  }

  .remove-btn-mobile:hover:not(:disabled) .remove-icon-svg {
    transform: translateY(-1px) scale(1.1);
  }

  .card-details {
    padding: 0 16px 16px 16px;
    border-top: 1px solid rgba(188, 174, 164, 0.3);
  }

  .detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    font-size: 14px;
  }

  .detail-label {
    color: var(--color-text-unselected, #937e7e);
    font-weight: 500;
  }

  .detail-value {
    color: var(--color-text-selected, #f5d1c0);
    font-weight: 600;
  }

  .total-row {
    border-top: 1px solid rgba(188, 174, 164, 0.3);
    margin-top: 8px;
    padding-top: 12px;
  }

  .total-value {
    font-size: 16px;
    color: var(--color-select, #d17361);
  }

  .total-section {
    margin-top: 24px;
  }

  .total-bar {
    flex-direction: column;
    gap: 16px;
    background: rgba(245, 209, 192, 0.05);
    padding: 20px;
    border-radius: 12px;
    border: 1px solid var(--color-icon-secondary, #bcaea4);
  }

  .total-label {
    font-size: 18px;
    text-align: center;
  }

  .checkout-btn {
    width: 100%;
    padding: 16px;
    font-size: 16px;
    font-weight: 600;
    min-height: 48px;
  }

  .empty-cart {
    padding: 60px 20px;
  }

  .empty-cart h3 {
    font-size: 20px;
  }

  .empty-description {
    font-size: 15px;
  }

  .error-actions {
    flex-direction: column;
    gap: 8px;
  }

  .retry-btn, .dismiss-btn {
    width: 100%;
    padding: 12px 16px;
    min-height: 44px;
  }

  .success-toast {
    bottom: 16px;
    right: 16px;
    left: 16px;
    text-align: center;
  }

}
</style>