<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ResultDialog from '@/components/common/BaseConfirmModal.vue'

const route = useRoute()
const router = useRouter()

const dialogVisible = ref(false)
const statusMessage = ref('')
const detailMessage = ref('')
const isSuccess = ref(false)

onMounted( () => {
  
  const orderId = route.query.orderId
  const orderNumber = route.query.orderNumber
  const transactionId = route.query.transactionId
  
  let subType = localStorage.getItem('subType')
  if (!subType) {
    const pendingOrder = sessionStorage.getItem('pendingOrder')
    if (pendingOrder) {
      try {
        const orderData = JSON.parse(pendingOrder)
        subType = orderData.subscriptionType
      } catch (err) {
        console.warn('sessionStorage 數據解析失敗:', err)
      }
    }
  }

  console.log('獲取到的參數:', { orderId, orderNumber, transactionId, subType })

  if (orderId && orderNumber && transactionId) {
    statusMessage.value = '付款成功'
    detailMessage.value = '訂閱已啟用，歡迎成為酒友卡會員！'
    isSuccess.value = true
    
    console.log('設定成功狀態')
  } else {
    console.error('缺少必要參數:', { orderId, orderNumber, transactionId })
    statusMessage.value = '付款失敗'
    detailMessage.value = '缺少必要參數，請聯繫客服'
    isSuccess.value = false
  }
  
  if (route.query.orderId || route.query.transactionId) {
    router.replace({ query: {} });
  }

  try {
    localStorage.removeItem('transactionId')
    localStorage.removeItem('expireTime')
    localStorage.removeItem('orderId')
    localStorage.removeItem('subType')
    sessionStorage.removeItem('pendingOrder')
    
  } catch (err) {
    console.warn('清理暫存資料失敗:', err)
  }

  dialogVisible.value = true
  
})



function handleConfirm() {
  const user = JSON.parse(localStorage.getItem('user'))
  if (isSuccess.value) {
    router.push(`/member/${user.id}/member-card`)
  } else {
    router.push('/subscription')
  }
}

function handleCancel() {
  handleConfirm()
}
</script>

<template>
  <ResultDialog
    :visible="dialogVisible"
    :title="statusMessage"
    :message="detailMessage"
    type="success"
    confirm-text="前往優惠券"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  />
</template>
