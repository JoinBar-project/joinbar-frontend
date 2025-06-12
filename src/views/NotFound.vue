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
  <div class="not-found min-h-screen bg-gray-50">
    <div class="container py-8 px-5 md:p-10 max-w-lg bg-white rounded-lg shadow-lg">
      <h1 class="text-6xl md:text-7xl font-bold text-gray-500 mb-5">404</h1>
      <h2 class="text-2xl mb-3 text-gray-700">頁面未找到</h2>
      <p class="text-gray-500 mb-8 leading-6">抱歉，您訪問的頁面不存在</p>
      
      <div class="actions gap-4 flex-col md:flex-row">
        <router-link to="/" class="btn btn-primary">回到首頁</router-link>
        <button @click="goBack" class="btn btn-secondary">返回上一頁</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  text-align: center;
}

.actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
	text-decoration: none;
  transition: background-color 0.2s;
  display: inline-block;
	@apply px-5 py-2.5 border-0 rounded font-medium cursor-pointer;
}

.btn-primary {
  @apply bg-blue-600 text-white hover:bg-blue-700;
}

.btn-secondary {
  @apply bg-gray-500 text-white hover:bg-gray-600;
}
</style>