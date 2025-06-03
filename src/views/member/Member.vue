<template>
  <div class="page">
    <img src="/cart.png" alt="Cart Icon" class="cart-icon" @click="goCart">
    <h1>會員服務</h1>
    <p>管理您的帳號與偏好設定。</p>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goCart = () => {
  router.push('/cart')
}
</script>

<style scoped>
.page {
  padding: 32px;
  position: relative;
}

.cart-icon {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  cursor: pointer;
}
</style>