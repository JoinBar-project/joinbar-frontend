<template>
  <div class="cart-container">
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

      <div class="total-bar">
        <p class="total-label">
          總金額：<strong>${{ totalPrice }}</strong>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useCartStore } from '@/stores/cartStore'
import { computed, ref, onMounted } from 'vue'

const cart = useCartStore()
const isLoading = ref(true)

onMounted(() => {
  setTimeout(() => {
    isLoading.value = false
    console.log('付款頁面已載入')
  }, 600)
})

const cartItems = computed(() => cart.items)

const calcSubtotal = (item) => (item.price * item.quantity).toLocaleString()

const totalPrice = computed(() =>
  cartItems.value.reduce((acc, item) => acc + item.price * item.quantity, 0).toLocaleString(),
)
</script>

<style scoped>
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
</style>