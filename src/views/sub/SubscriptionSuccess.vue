<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-6">
    <div class="bg-white p-8 rounded-xl shadow-md text-center max-w-md w-full">
      <div v-if="isLoading" class="loading">
        <div class="spinner"></div>
        <p>處理中...</p>
      </div>

      <div v-else-if="isSuccess" class="success">
        <div class="success-icon">✅</div>
        <h2 class="text-3xl font-bold text-green-600 mb-4">訂閱成功！</h2>
        <p class="text-gray-600 text-lg mb-6">感謝您的訂閱，酒友卡已啟用！</p>
        
        <div v-if="orderInfo" class="order-details mb-6">
          <div class="bg-gray-50 p-4 rounded-lg text-left">
            <p><strong>訂單編號：</strong>{{ orderInfo.orderNumber }}</p>
            <p><strong>訂閱方案：</strong>{{ subscriptionPlan }}</p>
            <p><strong>付款金額：</strong>${{ formatAmount(orderInfo.totalAmount) }}</p>
            <p><strong>付款時間：</strong>{{ formatTime(orderInfo.paidAt) }}</p>
            <p v-if="orderInfo.transactionId"><strong>交易編號：</strong>{{ orderInfo.transactionId }}</p>
          </div>
        </div>

        <div class="benefits-info mb-6" v-if="benefitInfo">
          <div class="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 class="text-green-800 font-semibold mb-2">🎉 您的權益</h3>
            <ul class="text-sm text-green-700 text-left">
              <li v-for="benefit in benefitInfo.benefits" :key="benefit.benefit">
                • {{ benefit.benefit.replace('1 次', `${benefit.counts} 次`) }}
              </li>
            </ul>
            <p class="text-xs text-green-600 mt-2">有效期：{{ benefitInfo.duration }} 天</p>
          </div>
        </div>

        <div class="action-buttons">
          <router-link 
            :to="memberCardRoute" 
            class="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition mr-4"
          >
            查看優惠券
          </router-link>
          
          <router-link 
            to="/subscription" 
            class="inline-block px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            查看訂閱方案
          </router-link>
        </div>
      </div>

      <div v-else class="error">
        <div class="error-icon">❌</div>
        <h2 class="text-3xl font-bold text-red-600 mb-4">處理失敗</h2>
        <p class="text-gray-600 text-lg mb-6">{{ errorMessage }}</p>
        
        <div class="action-buttons">
          <router-link 
            to="/subscription" 
            class="inline-block px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            返回訂閱頁面
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import apiClient from '@/api/axios'
import dayjs from 'dayjs'

const route = useRoute()

const isLoading = ref(true)
const isSuccess = ref(false)
const errorMessage = ref('')
const orderInfo = ref(null)
const subscriptionPlan = ref('')
const benefitInfo = ref(null)

// 動態生成會員卡路由
const memberCardRoute = computed(() => {
  try {
    const user = JSON.parse(localStorage.getItem('user'))
    return `/member/${user.id}/membercard`
  } catch {
    return '/member/1/membercard' // 默認路由
  }
})

onMounted(async () => {
  const orderId = route.query.orderId
  const orderNumber = route.query.orderNumber
  const transactionId = route.query.transactionId

  console.log('🔄 訂閱成功頁面啟動:', { orderId, orderNumber, transactionId })

  try {
    if (!orderId) {
      throw new Error('缺少訂單資訊')
    }

    // 獲取訂單詳情
    console.log('📋 獲取訂單詳情...')
    const response = await apiClient.get(`/orders/${orderId}/details`)
    orderInfo.value = response.data.order

    console.log('📋 訂單資料:', orderInfo.value)

    // 獲取訂閱方案名稱和權益
    const subscriptionItem = orderInfo.value.items.find(item => item.subscriptionType)
    if (subscriptionItem) {
      const planInfo = getSubscriptionPlanInfo(subscriptionItem.subscriptionType)
      subscriptionPlan.value = planInfo.title
      benefitInfo.value = planInfo
    }

    // 檢查訂單狀態
    if (orderInfo.value.status === 'confirmed') {
      isSuccess.value = true

      // ✅ 自動建立優惠券（如果有訂閱 ID）
      try {
        const subItem = orderInfo.value.items.find(item => item.subscriptionId)
        if (subItem && subItem.subscriptionId) {
          console.log('🎫 建立優惠券，訂閱 ID:', subItem.subscriptionId)
          await apiClient.post('/benefit/create', {
            subId: subItem.subscriptionId
          })
          console.log('✅ 優惠券已自動建立')
        } else {
          console.warn('⚠️ 未找到訂閱 ID，跳過優惠券建立')
        }
      } catch (benefitError) {
        console.warn('⚠️ 優惠券建立失敗:', benefitError)
        // 不影響主流程，只是警告
      }
    } else {
      throw new Error(`訂單狀態異常: ${orderInfo.value.status}`)
    }

  } catch (error) {
    console.error('❌ 處理訂閱成功頁面失敗:', error)
    errorMessage.value = error.response?.data?.message || error.message || '處理失敗'
    isSuccess.value = false
  } finally {
    isLoading.value = false
  }
})

const getSubscriptionPlanInfo = (subType) => {
  const subPlans = {
    vip: {
      title: '尊爵黑卡',
      duration: 365,
      benefits: [
        { benefit: "VIP 專屬特調 1 次", counts: 3 },
        { benefit: "合作酒吧招待飲品 1 次", counts: 6 },
        { benefit: "合作酒吧招待小點 1 次", counts: 6 }
      ]
    },
    seasonal: {
      title: '季訂方案',
      duration: 90,
      benefits: [
        { benefit: "VIP 專屬特調 1 次", counts: 2 },
        { benefit: "合作酒吧招待飲品 1 次", counts: 3 },
        { benefit: "合作酒吧招待小點 1 次", counts: 3 }
      ]
    },
    monthly: {
      title: '小資月卡',
      duration: 30,
      benefits: [
        { benefit: "VIP 專屬特調 1 次", counts: 1 },
        { benefit: "合作酒吧招待飲品 1 次", counts: 1 },
        { benefit: "合作酒吧招待小點 1 次", counts: 1 }
      ]
    }
  }
  
  return subPlans[subType] || { 
    title: subType, 
    duration: 30, 
    benefits: [] 
  }
}

const formatAmount = (amount) => {
  if (!amount) return '0'
  return Number(amount).toLocaleString()
}

const formatTime = (timeString) => {
  if (!timeString) return '-'
  return dayjs(timeString).format('YYYY/MM/DD HH:mm')
}
</script>

<style scoped>
.loading, .success, .error {
  text-align: center;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.success-icon, .error-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.order-details, .benefits-info {
  margin: 20px 0;
}

.order-details p, .benefits-info li {
  margin: 8px 0;
  font-size: 14px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

@media (max-width: 640px) {
  .action-buttons {
    flex-direction: column;
  }
  
  .action-buttons a {
    margin: 0 0 8px 0 !important;
  }
}
</style>
