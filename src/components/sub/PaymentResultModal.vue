<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { confirmLinePayment } from '@/api/linepay'
import apiClient from '@/api/axios'

const route = useRoute()

const statusMessage = ref('')
const detailMessage = ref('')
const isSuccess = ref(false)

onMounted(async () => {
  console.log('🎯 回來時 token:', localStorage.getItem('access_token'))
  
  const transactionId = route.query.transactionId || localStorage.getItem('transactionId')
  const orderId = route.query.orderId || localStorage.getItem('orderId')
  const subType = localStorage.getItem('subType')

  try {
    if (!transactionId || !orderId) throw new Error('付款失敗')

    await confirmLinePayment(transactionId, orderId)
    await apiClient.post('/sub', { subType })

    statusMessage.value = '付款成功'
    detailMessage.value = '訂閱已啟用，歡迎成為酒友卡會員！'
    isSuccess.value = true
  } catch (err) {
    const message = err?.response?.data?.message || err?.message || ''
    if (message.includes('訂閱')) {
      statusMessage.value = '付款成功，但訂閱建立失敗'
      detailMessage.value = '請聯繫客服'
    } else if (message.includes('付款')) {
      statusMessage.value = '付款失敗'
      detailMessage.value = '請確認付款狀況或稍後再試'
    } else {
      statusMessage.value = '操作失敗'
      detailMessage.value = '請稍後再試一次'
    }
    isSuccess.value = false
  } finally {
    localStorage.removeItem('transactionId')
    localStorage.removeItem('expireTime')
    localStorage.removeItem('orderId')
    localStorage.removeItem('subType')
  }
})
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-6">
    <div class="bg-white p-8 rounded-xl shadow-md text-center max-w-md w-full">
      <h2 class="text-3xl font-bold text-gray-800 mb-4">{{ statusMessage }}</h2>
      <p class="text-gray-600 text-lg">{{ detailMessage }}</p>

      <router-link v-if="isSuccess" to="/member/card" class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition">
        查看優惠券
      </router-link>

      <router-link v-else to="/subs" class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition">
        返回訂閱頁
      </router-link>
    </div>
  </div>
</template>
