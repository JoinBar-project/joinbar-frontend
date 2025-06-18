<template>
  <div class="cart-container">
    <h2>購物車</h2>

    <div v-if="isLoading" class="loading-box">
      <div class="spinner"></div>
      <p>載入中，請稍候...</p>
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

      <div v-for="item in cartItems" :key="item.id" class="cart-row">
        <div class="product">
          <img
            class="product-img"
            :src="item.image || 'https://placehold.co/80x80?text=No+Image'"
            alt="活動圖片"
          />
          <div class="product-info">
            <p class="product-name">{{ item.name }}</p>
          </div>
        </div>

        <div class="price">${{ item.price }}</div>

        <div class="qty-box">
          <span>{{ item.quantity }}</span>
        </div>

        <div class="subtotal">${{ calcSubtotal(item) }}</div>

        <div class="actions">
          <button @click="removeItem(item.id)">刪除</button>
        </div>
      </div>

      <div class="total-bar">
        <p class="total-label">
          總金額：<strong>${{ totalPrice }}</strong>
        </p>
        <button class="checkout-btn" @click="goToPayment">去買單</button>
      </div>
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

onMounted(() => {
  setTimeout(() => {
    isLoading.value = false
  }, 400)
})

const cartItems = computed(() => cart.items)
const removeItem = (id) => cart.removeItem(id)
const calcSubtotal = (item) => (item.price * item.quantity).toLocaleString()
const totalPrice = computed(() =>
  cartItems.value.reduce((acc, item) => acc + item.price * item.quantity, 0).toLocaleString(),
)
const goToPayment = () => {
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
.qty-box {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}
.qty-box span {
  width: 36px;
  text-align: center;
  font-weight: 500;
}
.actions button {
  border: 1px solid var(--color-select, #d17361);
  background-color: transparent;
  color: var(--color-select, #d17361);
  padding: 6px 12px;
  font-size: 13px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}
.actions button:hover {
  background-color: var(--color-select, #d17361);
  color: white;
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
.checkout-btn:hover {
  background-color: #b85d4a;
}

.empty-cart {
  text-align: center;
  padding: 80px 40px;
  color: var(--color-text-selected, #f5d1c0);
}
.empty-icon {
  font-size: 80px;
  margin-bottom: 24px;
  opacity: 0.6;
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
</style>