<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { confirmLinePayment } from '@/api/linepay'
import apiClient from '@/api/axios'

const route = useRoute()
const router = useRouter()

const statusMessage = ref('')
const detailMessage = ref('')
const isSuccess = ref(false)

const props = defineProps({
  transactionId: String,
  orderId: String,
  subType: String
})

onMounted(async () => {

  const transactionId = route.query.transactionId || localStorage.getItem('transactionId')
  const orderId = route.query.orderId || localStorage.getItem('orderId')
  const subType = localStorage.getItem('subType')

  try{

    if(!transactionId || !orderId){
      throw new Error('付款失敗')
    }

    await confirmLinePayment(transactionId, orderId)
    console.log('付款確認成功')

    await apiClient.post('/sub', { subType })
    console.log('訂閱建立成功')

    statusMessage.value = '付款成功'
    detailMessage.value = '訂閱已啟用，歡迎成為酒友卡會員！'
    isSuccess.value = true

  }catch (err) {
    console.error('發生錯誤', err)

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

  }finally {
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
      <router-link
        v-if="isSuccess"
        to="/member/card"
        class="mt-4 inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >查看優惠券</router-link>
      <router-link
        v-else
        to="/subscribe"
        class="mt-4 inline-block bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
      >回訂閱頁面</router-link>
    </div>
  </div>
</template>

