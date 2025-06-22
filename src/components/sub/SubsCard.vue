<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { getAllSubPlans, createSubscriptionOrder, createLinePayment, confirmLinePayment } from '@/api/subsCard';

const spotlight = ref(null)
const cardData = ref([])

onMounted(async() => {
  try{
    const plans = await getAllSubPlans();
    cardData.value = plans;

  }catch (err) {
    console.warn('訂閱資料載入失敗');
  }
})

const handleSubscribe = async(subscriptionType) => {

  try{
    const order = await createSubscriptionOrder(subscriptionType);

    if (!order || !order.id) {
      throw new Error('訂單建立失敗');
    }

    const { paymentUrl, transactionId, expireTime } = await createLinePayment(order);

    localStorage.setItem('transactionId', transactionId);
    localStorage.setItem('expireTime', expireTime);
    localStorage.setItem('orderId', order.id);

    window.location.href = paymentUrl;

  }catch (err) {
    console.error('訂閱流程發生錯誤', err);
    alert('訂閱流程發生錯誤，請稍後再試');
  }
}

function handleMouseMove(e) {
  if (spotlight.value) {
    spotlight.value.style.transform = `translate(${e.clientX - 64}px, ${e.clientY - 64}px)`
  }
}

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
})


</script>


<template>
  <div class="relative overflow-hidden bg-stone-100">
    <div 
      ref="spotlight"
      class="pointer-events-none fixed top-0 left-0 w-32 h-32 rounded-full
           bg-yellow-400 opacity-40 blur-3xl z-50 transition-transform duration-75 mix-blend-screen">
    </div>
    <div class="max-w-screen">
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
                <span class="text-[var(--color-primary-orange)] text-3xl font-bold">${{ card.price.toLocaleString() }}</span> / {{ card.duration }}天
              </p>
              <div v-for="(benefit, idx) in card.benefits" :key="idx" class="flex py-4">
                <i class="fa-solid fa-check text-[var(--color-primary-orange)] pr-4"></i>
                <p class="text-stone-50 font-bold">{{ benefit.benefit.replace('1 次', `${benefit.counts} 次 `) }}</p>
              </div>
              <button
                @click="handleSubscribe(card.type)" 
                type="button" 
                class="mt-20 mb-10 px-6 py-2 text-lg text-stone-50 border-2 border-[var(--color-primary-orange)] rounded-[12px] bg-neutral-900 block mx-auto cursor-pointer hover:bg-[var(--color-primary-orange)]">
                即刻擁有
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<style scoped>

.title{
  text-shadow: 2px 2px 8px rgba(0,0,0,2);
}

</style>