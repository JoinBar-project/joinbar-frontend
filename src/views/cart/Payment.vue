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
          <img class="product-img" :src="item.image || 'https://placehold.co/80x80'" />
          <div class="product-info">
            <p class="product-name">{{ item.name }}</p>
          </div>
        </div>

        <div class="price">${{ item.price }}</div>
        <div class="quantity text-center">{{ item.quantity }}</div>
        <div class="subtotal">${{ calcSubtotal(item) }}</div>
      </div>

      <div class="payment-method section-spacing">
        <h3>選擇付款方式</h3>
        
        <!-- 付款方式選擇 -->
        <div class="payment-options">
          <!-- LINE Pay 選項 -->
          <button 
            class="btn bg-[#03C755] text-white border-[#00b544] payment-btn"
            :class="{ 'ring-2 ring-[#03C755] ring-offset-2': paymentMethod === 'linepay' }"
            @click="paymentMethod = 'linepay'"
          >
          <IconLine />
            LINE Pay
          </button>

          <!-- 信用卡選項 -->
          <button 
            class="btn bg-[#daa258] text-white border-[#c89242] payment-btn"
            :class="{ 'ring-2 ring-[#daa258] ring-offset-2': paymentMethod === 'creditcard' }"
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
          <!-- 確認付款按鈕 -->
          <button 
            class="btn bg-[#860914] text-white checkout-btn"
            :class="{ 'btn-disabled': !canSubmit || isSubmitting }"
            :disabled="!canSubmit || isSubmitting" 
            @click="submitOrder"
          >
            <span v-if="isSubmitting" class="loading loading-spinner loading-sm"></span>
            {{ isSubmitting ? '處理中...' : '確認付款' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useCartStore } from '@/stores/cartStore'
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import IconLine from '@/components/icons/IconLine.vue'
import IconCreditCard from '@/components/icons/IconCreditCard.vue'

const cart = useCartStore()
const router = useRouter()
const paymentMethod = ref('')
const isLoading = ref(true)
const isSubmitting = ref(false)

onMounted(() => {
  setTimeout(() => {
    // 檢查購物車是否為空
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
  return paymentMethod.value
})

const submitOrder = async () => {
  if (isSubmitting.value || !canSubmit.value) return

  try {
    isSubmitting.value = true

    // 模擬訂單建立
    const mockOrderResult = {
      order: {
        orderId: Date.now().toString(),
        orderNumber: `ORDER-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-6)}`,
        totalAmount: cartItems.value.reduce((acc, item) => acc + item.price * item.quantity, 0).toString()
      }
    }
    // 模擬 API 處理延遲
    await new Promise(resolve => setTimeout(resolve, 1500))

    // 根據付款方式處理
    if (paymentMethod.value === 'linepay') {
      // 顯示模擬訊息
      alert(`🟢 LINE Pay 模擬付款\n\n訂單編號：${mockOrderResult.order.orderNumber}\n金額：${totalPrice.value}\n\n點擊確定完成模擬付款`)
      
    } else if (paymentMethod.value === 'creditcard') {
      // 模擬信用卡付款
      alert(`💳 信用卡模擬付款\n\n訂單編號：${mockOrderResult.order.orderNumber}\n金額：${totalPrice.value}\n\n點擊確定完成模擬付款`)
    }

    // 模擬付款成功，清空購物車
    cart.clearCart()
    
    // 跳轉到成功頁面
    router.push(`/order-success/${mockOrderResult.order.orderNumber}?orderId=${mockOrderResult.order.orderId}`)

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

/* 付款方式選擇樣式 */
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

/* 確認付款按鈕樣式 */
.checkout-btn {
  font-size: 14px;
  padding: 10px 24px;
  transition: all 0.2s ease-in-out;
}

/* 確認付款按鈕 hover 效果 */
.checkout-btn:hover:not(.btn-disabled) {
  background-color: #a50b18;
  border-color: #a50b18;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(134, 9, 20, 0.3);
}

/* 確認付款按鈕 active 狀態 */
.checkout-btn:active:not(.btn-disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(134, 9, 20, 0.25);
}

/* 禁用狀態的按鈕不應有 hover 效果 */
.checkout-btn.btn-disabled {
  cursor: not-allowed;
}
</style>