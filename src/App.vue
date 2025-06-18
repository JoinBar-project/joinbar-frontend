<script setup>
import NavBar from '@/components/NavBar.vue'
import Footer from '@/components/Footer.vue'
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// 全局 LINE Pay 回調處理
const handleGlobalLinePayCallback = () => {
  const urlParams = new URLSearchParams(window.location.search)
  const transactionId = urlParams.get('transactionId')
  const orderId = urlParams.get('orderId')
  
  console.log('🔍 App.vue 檢查 LINE Pay 回調:', {
    href: window.location.href,
    transactionId,
    orderId,
    currentPath: route.path
  })
  
  // 如果有 LINE Pay 參數且不在正確頁面
  if (transactionId && orderId && route.path !== '/payment-waiting') {
    console.log('✅ 檢測到 LINE Pay 回調，跳轉到等待頁面')
    
    router.replace({
      path: '/payment-waiting',
      query: { orderId, transactionId }
    })
  }
}

onMounted(() => {
  // 頁面載入時檢查
  handleGlobalLinePayCallback()
})

// 監聽路由變化
router.afterEach((to) => {
  // 每次路由變化都檢查
  setTimeout(() => {
    handleGlobalLinePayCallback()
  }, 100)
})
</script>

<template>
  <div>
    <NavBar />
    <router-view />
    <Footer />
  </div>
</template>

<style>
body {
  margin: 0;
  font-family: Arial, sans-serif;
  overflow-x: hidden; /* 防止水平滾動條 */
  padding-bottom: 200px;
}

.home {
  padding: 2rem;
  text-align: center;
}
</style>