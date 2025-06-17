<script setup>
import { ref, onMounted } from 'vue'
import AdModal from '@/components/AdModal.vue'
import adImageFile from '@/assets/homepage/subscribe.jpg'

const showAd = ref(false)
const adImage = adImageFile

// onMounted(() => {
//   const hasSeenAd = localStorage.getItem('hasSeenAd')
//   if (!hasSeenAd) {
//     showAd.value = true
//     localStorage.setItem('hasSeenAd', 'true')
//   }
// })

onMounted(() => {
  showAd.value = true
})

const videoUrl = new URL('@/assets/homepage/JOINBAR-NOLOGO.mp4', import.meta.url).href

const features = [
  {
    title: "社群活動",
    desc: "參與我們舉辦的品酒會、派對等精彩活動。",
    image: new URL('@/assets/homepage/wine.gif', import.meta.url).href,
    path: "/event",
    gridArea: "1 / 2 / 3 / 4"
  },
  {
    title: "酒吧地圖",
    image: new URL('@/assets/homepage/google-maps.gif', import.meta.url).href,
    path: "/map",
    gridArea: "1 / 1 / 2 / 2"
  },
  {
    title: "訂閱優惠",
    image: new URL('@/assets/homepage/fireworks-.gif', import.meta.url).href,
    path: "/subscription",
    gridArea: "1 / 4 / 2 / 5"
  },
  {
    title: "用戶評論",
    image: new URL('@/assets/homepage/interaction.gif', import.meta.url).href,
    path: "/comments",
    gridArea: "2 / 1 / 3 / 2"
  },
  {
    title: "會員服務",
    image: new URL('@/assets/homepage/social-care.gif', import.meta.url).href,
    path: "/member",
    gridArea: "2 / 4 / 3 / 5"
  }
]

const bars = [
  {
    name: "The Alchemist's Corner",
    desc: "神秘的燈光與獨創調酒。",
    image: new URL('@/assets/homepage/bar-1.jpg', import.meta.url).href
  },
  {
    name: "Sunset Vista Rooftop",
    desc: "城市天際線下的微醺時光。",
    image: new URL('@/assets/homepage/bar-2.jpg', import.meta.url).href
  },
  {
    name: "Liquid Artistry",
    desc: "欣賞調酒師的指尖魔法。",
    image: new URL('@/assets/homepage/bar-3.jpg', import.meta.url).href
  },
  {
    name: "The Cozy Barrel",
    desc: "溫馨舒適的週末好去處。",
    image: new URL('@/assets/homepage/bar-4.jpg', import.meta.url).href
  }
]

</script>

<template>
  <AdModal
    v-if="showAd"
    :adImage="adImage"
    @close="showAd = false"
  />
  <section class="hero">
  <video class="hero-bg-video" autoplay muted loop playsinline>
    <source :src="videoUrl" type="video/mp4">
    您的瀏覽器不支援影片播放。
  </video>
  <div class="frosted-mask"></div>
  <div class="hero-content">
    <div class="hero-main-visual">
      <img src="/joinbar-logo.png" alt="joinbar-logo">
      <h1>隨時隨地，想喝就揪吧</h1>
    </div>
  </div>
  </section>

  <section id="features" class="features-section">
    <div class="section-number-bg num-1">1</div>
    <h2>JoinBar 為你串連酒吧、活動與朋友</h2>
    <div class="features-grid">
      <router-link
        v-for="(feature, index) in features"
        :key="index"
        :to="feature.path"
        class="feature-card"
        :style="{ gridArea: feature.gridArea }"
      >
        <img :src="feature.image" :alt="feature.title" />
        <h3>{{ feature.title }}</h3>
        <p v-if="feature.desc">{{ feature.desc }}</p>
      </router-link>
    </div>
  </section>

  <section id="popular" class="popular-bars-section">
    <div class="section-number-bg num-2">2</div>
    <h2>熱門酒吧推薦，不醉不歸排行榜</h2>
    <div class="bar-cards-container">
      <div class="bar-card" v-for="(bar, index) in bars" :key="index">
        <img :src="bar.image" :alt="bar.name" />
        <div class="bar-info">
          <h3>{{ bar.name }}</h3>
          <p>{{ bar.desc }}</p>
        </div>
      </div>
    </div>
  </section>

</template>

<style scoped>
@reference "tailwindcss";

.hero {
  @apply text-center relative overflow-hidden h-screen;
}

.hero-bg-video {
  @apply absolute w-full h-full object-cover z-0;
}

.hero-main-visual {
  @apply flex flex-col items-center gap-[20px] relative;
}

.hero-main-visual img {
  @apply relative z-[1];
}

.hero-main-visual h1 {
  @apply text-[20px] relative z-[2] text-white ;
}

.frosted-mask {
  @apply absolute bottom-0 left-0 w-full h-full backdrop-blur-[6px] z-[1];
}

.hero-content {
  @apply flex justify-center items-center gap-[32px] relative max-w-[600px] mx-auto z-[2];
}

.features-section,
.popular-bars-section {
  @apply px-[5%] py-[96px] relative overflow-hidden;
}

.section-number-bg {
  @apply absolute text-[480px] font-black z-0 select-none -translate-y-1/2 left-[20%];
}

.num-1 {
  @apply text-white/50;
}

.num-2 {
  @apply text-[#DAA258]/50;
}


.features-section {
  @apply bg-[rgba(175,177,140,0.5)];
}

.features-grid {
  @apply grid gap-[24px] max-w-[1200px] mx-auto relative z-[2];
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(2, 1fr);
  aspect-ratio: 2.5 / 1;
}

.feature-card {
  @apply bg-white border border-[#e0e0e0] rounded-[12px] p-[16px] flex flex-col justify-end items-center text-center text-[17.6px] font-bold shadow-[0_4px_8px_rgba(0,0,0,0.05)] transition-transform duration-300 ease-in-out cursor-pointer;
}

.feature-card:hover {
  @apply -translate-y-[10px] shadow-[0_12px_24px_rgba(0,0,0,0.1)];
}

.feature-card h3 {
  @apply m-0 mb-[8px] text-[20px];
}

.feature-card p {
  @apply m-0 text-[14.4px] font-normal text-[#666666];
}

.feature-card img {
  @apply grayscale transition duration-300 ease-in-out opacity-80;
}

.feature-card img:hover {
  @apply filter-none;
}

.popular-bars-section {
  @apply bg-white;
}

.features-section h2,
.popular-bars-section h2 {
  @apply text-center text-[32px] mb-[16px] font-bold;
}

.bar-cards-container {
  @apply flex justify-center gap-[24px] flex-wrap max-w-[1300px] mx-auto relative z-[2];
}

.bar-card {
  @apply bg-white rounded-[12px] shadow-[0_4px_12px_rgba(0,0,0,0.1)] overflow-hidden w-[280px] shrink-0 transition-transform duration-300 ease-in-out;
}

.bar-card:hover {
  @apply -translate-y-[10px] shadow-[0_12px_24px_rgba(0,0,0,0.15)];
}

.bar-card img {
  @apply w-full h-[350px] object-cover block;
}

.bar-card .bar-info {
  @apply p-[16px];
}

.bar-card h3 {
  @apply m-0 mb-[8px] text-[20px];
}

.bar-card p {
  @apply m-0 text-[#666666] text-[14.4px];
}

</style>