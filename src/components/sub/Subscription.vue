<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const spotlight = ref(null)

const cardData = [
  {
    title: "尊爵黑卡",
    price: "$2,999",
    duration: "365 天",
    benefits: [
      "VIP 專屬特調 3 次 / 年",
      "合作酒吧招待飲品 6 次 / 年",
      "合作酒吧招待小點 6 次 / 年"
    ]
  },
  {
    title: "季訂方案",
    price: "$1,999",
    duration: "90 天",
    benefits: [
      "VIP 專屬特調 2 次 / 年",
      "合作酒吧招待飲品 3 次 / 季",
      "合作酒吧招待小點 3 次 / 季"
    ]
  },
  {
    title: "小資月卡",
    price: "$999",
    duration: "30 天",
    benefits: [
      "VIP 專屬特調 1 次 / 年",
      "合作酒吧招待飲品 1 次 / 月",
      "合作酒吧招待小點 1 次 / 月"
    ]
  }
];

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
      <div class="bg-[url('@/components/sub/picture/bar-background2.jpg')] py-20 w-full relative bg-cover bg-[center_88%] opacity-92">
        <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(0,0,0,0.1)_20%,_rgba(0,0,0,0.9)_100%)]"></div>
        <div class="mb-4 relative z-20">
          <h2 class="title text-center p-10 text-7xl text-stone-50 font-bold">酒友卡訂閱</h2>
          <p class="text-center text-stone-50 text-2xl">每月酒香，讓友情更醇厚</p>
        </div>
      </div>

      <div class="max-w-7xl m-auto">
        <div class="grid grid-cols-3 gap-20">
          <div v-for="(card, index) in cardData" :key="index" class="bg-[var(--color-black)] flex border rounded-[16px] my-20 hover:scale-105 transition-transform duration-300">
            <div class="m-auto w-[66%]">
              <h3 class="text-6xl text-stone-50 pt-10 pb-4 w-full">{{ card.title }}</h3>
              <p class="text-zinc-300 py-10 text-center">
                <span class="text-[var(--color-primary-orange)] text-3xl font-bold">{{ card.price }}</span> / {{ card.duration }}
              </p>
              <div v-for="(benefit, idx) in card.benefits" :key="idx" class="flex py-4">
                <i class="fa-solid fa-check text-[var(--color-primary-orange)] pr-4"></i>
                <p class="text-stone-50 font-bold">{{ benefit }}</p>
              </div>
              <button 
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