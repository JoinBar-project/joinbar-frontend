<script setup>

import {  ref, computed, onMounted, onUnmounted } from 'vue'

const currentIndex = ref(0)
const visibleCount = ref(3)

const updateVisibleCount = () => {
  visibleCount.value = window.innerWidth < 768 ? 1 : 3
}

const visibleBars = computed(() => {
  const bars = []
  for (let i = 0; i < visibleCount.value; i++) {
    const index = (currentIndex.value + i) % barList.value.length
    bars.push(barList.value[index])
  }
  return bars
})

function prev() {
  currentIndex.value =
    (currentIndex.value - visibleCount.value + barList.value.length) % barList.value.length
}

function next() {
  currentIndex.value = (currentIndex.value + visibleCount.value) % barList.value.length
}

const barList = ref([
  { id: 1, name: '醉後不歸路', location: '台北市大安區信義路123號', image: new URL('../../assets/sub/sub-bar1.jpg', import.meta.url).href },
  { id: 2, name: '夜色迷醉', location: '台北市中山區林森北路88號', image: new URL('../../assets/sub/sub-bar2.jpg', import.meta.url).href },
  { id: 3, name: '微醺時刻', location: '新北市板橋區文化路二段101號', image: new URL('../../assets/sub/sub-bar3.jpg', import.meta.url).href },
  { id: 4, name: '霓虹之夜', location: '台中市西區公益路150號', image: new URL('../../assets/sub/sub-bar4.jpg', import.meta.url).href },
  { id: 5, name: '小酌時光', location: '高雄市鼓山區美術東五路3號', image: new URL('../../assets/sub/sub-bar5.jpg', import.meta.url).href },
])

onMounted(() => {
  updateVisibleCount()
  window.addEventListener('resize', updateVisibleCount)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateVisibleCount)
})

</script>


<template >
  <div class="relative mx-6 md:max-w-7xl pb-10 md:pb-40 md:mx-auto">
    <div class="text-4xl md:text-5xl text-center pb-8 md:pb-20 font-bold"> 合作酒吧</div>
    <div class="flex justify-around items-center pb-4">
      <button @click="prev" class="w-10 md:w-auto flex justify-center">
        <i class="fa-solid fa-caret-left text-6xl active:text-[var(--color-primary-orange)] md:hover:text-[var(--color-primary-orange)]"></i>
      </button>

      <div class="flex flex-col md:flex-row gap-6 md:gap-20 transition-all items-center">
        <div
          v-for="bar in visibleBars"
          :key="bar.id"
          class="bg-white shadow-md rounded-xl overflow-hidden w-54 md:w-64 flex-shrink-0"
        >
          <img :src="bar.image" alt="bar image" class="w-full h-40 object-cover" />
          <div class="p-4">
            <div class="text-lg font-semibold">{{ bar.name }}</div>
            <div class="text-gray-500 text-sm">{{ bar.location }}</div>
          </div>
        </div>
      </div>
      <button @click="next" class="w-10 md:w-auto flex justify-center">
        <i class="fa-solid fa-caret-right text-6xl active:text-[var(--color-primary-orange)] md:hover:text-[var(--color-primary-orange)]"></i>
      </button>
    </div>
  </div>
</template>


<style scoped>

.title{
  text-shadow: 2px 2px 8px rgba(0,0,0,2);
}

</style>