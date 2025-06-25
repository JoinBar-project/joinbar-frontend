<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f8ecd6] to-[#e1ac67] p-6">
    <div class="bg-white text-center rounded-2xl shadow-xl px-8 py-12 md:p-16 max-w-lg w-full relative animate-fade-in translate-y-[-10%] md:translate-y-[-15%]">
      <div class="number-container mb-8">
        <h1 class="text-5xl md:text-6xl font-black gradient-text mb-4">404</h1>
      </div>
      
      <h2 class="text-3xl mb-4 font-semibold gradient-text-secondary">頁面未找到</h2>
      <p class="text-[var(--color-black)] font-bold mb-10 leading-7 text-lg">抱歉，您造訪的頁面好像不存在耶！</p>
      
      <div class="flex flex-col md:flex-row justify-center gap-4">
        <router-link to="/" class="bg-gradient-to-br from-[#f8ecd6] to-[#e1ac67] rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transform transition-all">
          <span class="flex items-center justify-center px-6 py-3 text-[var(--color-black)] font-semibold">
            <svg class="w-5 h-5 mr-2 text-[var(--color-black)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
            回到首頁
          </span>
        </router-link>

        <button @click="goBack" class="bg-gradient-to-br from-[#f8ecd6] to-[#e1ac67] rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transform transition-all">
          <span class="flex items-center justify-center px-6 py-3 text-[var(--color-black)] font-semibold">
            <svg class="w-5 h-5 mr-2 text-[var(--color-black)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            返回上一頁
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    router.push('/')
  }
}
</script>

<style>
html, body {
  height: 100%;
  margin: 0;
  padding: 0;
}
</style>

<style scoped>
.container {
  text-align: center;
  background: white;
  position: relative;
  border-radius: 1rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}
.custom-shadow {
  box-shadow: 0 4px 8px rgba(215, 135, 149, 0.3);
}
.number-container {
  position: relative;
  display: inline-block;
}
.gradient-text {
  background: linear-gradient(135deg, #e1ac67, #d2984c, #f8ecd6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 4px 8px rgba(235, 204, 150, 0.3);
  animation: pulse 3s ease-in-out infinite;
}
.gradient-text-secondary {
  background: linear-gradient(135deg, #da9e51, #e1ac67);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@media (max-width: 768px) {
  .container {
    margin: 20px;
    padding: 2rem 1.5rem;
  }
  .gradient-text {
    font-size: 3rem;
  }
  .actions {
    flex-direction: column;
    gap: 12px;
  }
  .gradient-button {
    width: 100%;
  }
}
</style>