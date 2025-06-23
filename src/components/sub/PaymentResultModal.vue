<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { confirmLinePayment } from '@/api/linepay'
import apiClient from '@/api/axios'

const route = useRoute()

const props = defineProps({
  transactionId: String,
  orderId: String,
  subType: String
})

const emits = defineEmits('close')

// 畫面顯示狀態
const statusMessage = ref('')
const detailMessage = ref('')

onMounted(async () => {
  const transactionId = route.query.transactionId
  const orderId = route.query.orderId
  const subType = localStorage.getItem('subType')

  console.log('🟢 付款回傳：', { transactionId, orderId, subType })

  try {
    // ✅ 1. 確認付款狀態
    await confirmLinePayment(transactionId, orderId)
    console.log('✅ 付款確認成功')

    // ✅ 2. 建立訂閱資料
    if (!subType) throw new Error('找不到訂閱類型')
    console.log('✅ 訂閱建立成功', res.data)

    await apiClient.post('/sub', { subType })

    // ✅ 顯示成功提示
    statusMessage.value = '✅ 付款成功'
    detailMessage.value = '訂閱已啟用，歡迎成為酒友卡會員！'
  } catch (err) {
    console.error('付款成功但訂閱建立失敗', err)
    statusMessage.value = '⚠️ 付款成功，但訂閱建立失敗'
    detailMessage.value = '請稍後再試一次，或聯繫我們協助處理'
  } finally {
    // ✅ 3. 清除付款流程暫存資料
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
      <router-link to="/" class="mt-6 inline-block text-blue-600 underline hover:text-blue-800 transition">
        回首頁
      </router-link>
    </div>
  </div>
</template>

