<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import BaseAlertModal from '@/components/common/BaseAlertModal.vue'
import { 
  getAllSubPlans, 
  createSubscriptionOrder, 
  createLinePayment, 
  checkSubscriptionStatus, 
  getSubscriptionOrderStatus, 
  cancelSubscriptionOrder
 } from '@/api/subsCard'

const spotlight = ref(null)
const cardData = ref([])
const activeSubTypes = ref([])
const alertVisible = ref(false)
const alertType = ref('warning')
const alertTitle = ref('')
const alertMessage = ref('')
const authStore = useAuthStore()

const showAlert = (type, title, message) => {
  alertType.value = type
  alertTitle.value = title
  alertMessage.value = message
  alertVisible.value = true
}

const handleSubscribe = async (subscriptionType) => {
  try {
    // 1. 檢查登入
    if (!authStore.isAuthenticated) {
      showAlert('warning', '尚未登入', '請先登入才能訂閱');
      return;
    }

    // 2. 是否已有有效訂閱
    const validSubs = await checkSubscriptionStatus();
    const alreadySubscribed = validSubs?.some(
      (sub) => sub.subType === subscriptionType
    );

    if (alreadySubscribed) {
      showAlert('warning', '您已訂閱此方案，目前仍在有效期內')
      return;
    }

    // 3. 檢查是否已有相同訂閱的 pending 訂單
    const pendingOrder = await getSubscriptionOrderStatus(subscriptionType);

    if (pendingOrder) {
      await cancelSubscriptionOrder(pendingOrder.id);
    }

    // 4. 建立新訂單
    const order = await createSubscriptionOrder(subscriptionType);
    if (!order?.orderId) throw new Error('訂單建立失敗');

    // 5. 建立 LINE Pay 付款
    const { paymentUrl, transactionId, expireTime } = await createLinePayment(order);
    if (!paymentUrl) throw new Error('付款連結為空');

    // 6. 儲存付款資訊（導向付款頁面前）
    localStorage.setItem('transactionId', transactionId);
    localStorage.setItem('expireTime', expireTime);
    localStorage.setItem('orderId', order.orderId);
    localStorage.setItem('subType', subscriptionType);

    // 7. 導向付款頁
    setTimeout(() => {
      window.location.href = paymentUrl;
    }, 1000);

  } catch (err) {
    console.error('訂閱流程發生錯誤:', err);
    showAlert('danger', '訂閱流程發生錯誤', err?.message || '請稍後再試');
  }
};

const isSubscribed = (type) => {
  return activeSubTypes.value.includes(type)
}

onMounted(async () => {
  try {
    const plans = await getAllSubPlans()
    cardData.value = plans
  } catch (err) {
    console.warn('訂閱資料載入失敗')
  }

  if (authStore.isAuthenticated) {
    try {
      const currentSubs = await checkSubscriptionStatus()
      activeSubTypes.value = currentSubs.map(sub => sub.subType)
    } catch (err) {
      console.warn('訂閱狀態讀取失敗')
    }
  }

  window.addEventListener('mousemove', handleMouseMove)
})

const handleMouseMove = (e) => {

  if (spotlight.value) {
    spotlight.value.style.transform = `translate(${e.clientX - 64}px, ${e.clientY - 64}px)`
  }
}

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
})
</script>


<template>
  <div class="relative overflow-hidde">
    <div 
      ref="spotlight"
      class="pointer-events-none fixed top-0 left-0 w-32 h-32 rounded-full
             bg-yellow-400 opacity-50 blur-3xl z-50 transition-transform duration-75 mix-blend-screen">
    </div>

    <div class="bg-[url('@/assets/sub/bar-background2.jpg')] py-20 w-full relative bg-cover bg-[center_88%] opacity-92">
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,0,0,0.1)_20%,_rgba(0,0,0,0.9)_100%)]"></div>
      <div class="mb-4 relative z-20">
        <h2 class="title text-center p-10 text-7xl text-stone-50 font-bold">酒友卡訂閱</h2>
        <p class="text-center text-stone-50 text-2xl">每月酒香，讓友情更醇厚</p>
      </div>
    </div>

    <div class="max-w-7xl m-auto">
      <div class="grid grid-cols-3 gap-20">
        <div
          v-for="card in cardData"
          :key="card.type"
          class="bg-[var(--color-black)] flex border rounded-[16px] my-20 hover:scale-105 transition-transform duration-300"
        >
          <div class="m-auto w-[66%]">
            <h3 class="text-6xl text-stone-50 pt-10 pb-4 w-full">{{ card.title }}</h3>
            <p class="text-zinc-300 py-10 text-center">
              <span class="text-[var(--color-primary-orange)] text-3xl font-bold">
                ${{ card.price.toLocaleString() }}
              </span> / {{ card.duration }}天
            </p>
            <div v-for="(benefit, idx) in card.benefits" :key="idx" class="flex py-4">
              <i class="fa-solid fa-check text-[var(--color-primary-orange)] pr-4"></i>
              <p class="text-stone-50 font-bold">
                {{ benefit.benefit.replace('1 次', `${benefit.counts} 次 `) }}
              </p>
            </div>
            <button
              @click="handleSubscribe(card.type)"
              :disabled="isSubscribed(card.type)"
              type="button"
              :class="[
                'mt-20 mb-10 px-6 py-2 text-lg rounded-[12px] block mx-auto transition',
                isSubscribed(card.type)
                  ? 'disabled:bg-[var(--color-primary-orange)] text-white text-2xl'
                  : 'text-stone-50 border-2 border-[var(--color-primary-orange)] bg-neutral-900 hover:bg-[var(--color-primary-orange)]'
              ]"
            >
              {{ isSubscribed(card.type) ? '已訂閱' : '即刻擁有' }}
            </button>
          
          </div>
        </div>
      </div>
    </div>
  </div>
  <BaseAlertModal
    :visible="alertVisible"
    :type="alertType"
    :title="alertTitle"
    :message="alertMessage"
    @cancel="alertVisible = false"
    @close="alertVisible = false"
  />
</template>


<style scoped>

.title{
  text-shadow: 2px 2px 8px rgba(0,0,0,2);
}

</style>