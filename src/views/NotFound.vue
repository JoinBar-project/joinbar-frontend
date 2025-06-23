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

<template>
  <div class="not-found min-h-screen">
    <div class="container py-12 px-8 md:p-16 max-w-lg rounded-2xl custom-shadow backdrop-blur-sm">
      <div class="number-container mb-8">
        <h1 class="text-5xl md:text-6xl font-black gradient-text mb-4">404</h1>
      </div>
      
      <h2 class="text-3xl mb-4 font-semibold gradient-text-secondary">頁面未找到</h2>
      <p class="text-gray-600 mb-10 leading-7 text-lg">抱歉，您造訪的頁面好像不存在耶！</p>
      
      <div class="actions gap-4 flex-col md:flex-row">
        <router-link to="/" class="gradient-button primary-button">
          <span class="button-content">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
            </svg>
            回到首頁
          </span>
        </router-link>
        <button @click="goBack" class="gradient-button secondary-button">
          <span class="button-content">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            返回上一頁
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8ecd6, #e1ac67); /* ✅ 淺橘黃漸層 */
  position: relative;
  overflow: hidden;
  min-height: 100vh;
  padding: 2rem;
}

.container {
  text-align: center;
  background: white;
  position: relative;
  z-index: 1;
  border-radius: 1rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.custom-shadow {
  box-shadow: 0 4px 8px rgba(215, 135, 149, 0.3);
}

/* .container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #f8ecd6, #e1ac67);
  border-radius: 16px;
  padding: 3px;
  z-index: -1;
} */

/* .container::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  right: 3px;
  bottom: 3px;
  border-radius: 13px;
  z-index: -1;
} */

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

.actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}

.gradient-button {
  position: relative;
  padding: 0;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-decoration: none;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(235, 193, 150, 0.3);
}

.primary-button,
.secondary-button {
  background: linear-gradient(135deg, #f8ecd6, #e1ac67);
}

.button-content {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px 28px;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 2;
}

.gradient-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.gradient-button:hover {
  transform: translateY(-2px);
}

.gradient-button:hover::before {
  opacity: 1;
}

.gradient-button:active {
  transform: translateY(0);
}

/* 響應式設計 */
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