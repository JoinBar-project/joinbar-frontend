<script setup>

import { ref, computed } from 'vue'

const currentIndex = ref(0)
const visibleCount = 3

const visibleBars = computed(() => {
  const bars = []
  for (let i = 0; i < visibleCount; i++) {
    const index = (currentIndex.value + i) % barList.value.length
    bars.push(barList.value[index])
  }
  return bars
})

function prev() {
  
  currentIndex.value =
    (currentIndex.value - 1 + barList.value.length) % barList.value.length
}

function next() {
  currentIndex.value = (currentIndex.value + 1) % barList.value.length
}



const barList = ref([
  { 
    id: 1, 
    name: '醉後不歸路', 
    location: '台北市大安區信義路123號', 
    image: new URL('../../assets/sub/sub-bar1.jpg', import.meta.url).href 
  },
  { id: 2, 
    name: '夜色迷醉', 
    location: '台北市中山區林森北路88號', 
    image: new URL('../../assets/sub/sub-bar2.jpg', import.meta.url).href 
  },
  { id: 3, 
    name: '微醺時刻', 
    location: '新北市板橋區文化路二段101號', 
    image: new URL('../../assets/sub/sub-bar3.jpg', import.meta.url).href
  },
  { 
    id: 4, 
    name: '霓虹之夜', 
    location: '台中市西區公益路150號', 
    image: new URL('../../assets/sub/sub-bar4.jpg', import.meta.url).href
  },
  { 
    id: 5, 
    name: '小酌時光', 
    location: '高雄市鼓山區美術東五路3號', 
    image: new URL('../../assets/sub/sub-bar5.jpg', import.meta.url).href
  },
])

</script>


<template >
  <div class="relative max-w-7xl pb-40 mx-auto">
    <div class="text-5xl text-center pb-20 font-bold">合作酒吧</div>
    <div class="flex justify-around items-center pb-4">
      <button @click="prev">
        <i class="fa-solid fa-caret-left text-6xl hover:text-[var(--color-primary-orange)]"></i>
      </button>

      <div class="flex gap-20 transition-all">
        <div
          v-for="bar in visibleBars"
          :key="bar.id"
          class="bg-white shadow-md rounded-xl overflow-hidden w-64 flex-shrink-0"
        >
          <img :src="bar.image" alt="bar image" class="w-full h-40 object-cover" />
          <div class="p-4">
            <div class="text-lg font-semibold">{{ bar.name }}</div>
            <div class="text-gray-500 text-sm">{{ bar.location }}</div>
          </div>
        </div>
      </div>
      <button @click="next">
        <i class="fa-solid fa-caret-right text-6xl hover:text-[var(--color-primary-orange)]"></i>
      </button>
    </div>
  </div>
</template>


<style scoped>

.title{
  text-shadow: 2px 2px 8px rgba(0,0,0,2);
}

</style>