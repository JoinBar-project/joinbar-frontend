<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
</script>

<template>
  <div class="flex items-center justify-center min-h-screen px-4 bg-gray-50">
		<div class="w-full max-w-md p-6 mx-auto bg-white shadow-lg rounded-xl">

			<!-- 載入中狀態 -->
      <div v-if="isVerifying" class="text-center">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-secondary-green)] mx-auto mb-4"></div>
        <h2 class="mb-2 text-xl text-gray-700">驗證中...</h2>
        <p class="text-gray-500">請稍候，正在驗證您的信箱</p>
			</div>

			<!-- 驗證成功 -->
			<div class="text-center">
				<div class="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full">
          <i class="text-2xl text-green-500 fas fa-check"></i>
        </div>
				<h2 class="mb-2 text-xl font-semibold text-gray-800">驗證成功！</h2>
				<p class="mb-6 text-gray-600">您的信箱已成功驗證，現在可以正常使用所有功能了</p>
				<button 
          class="w-full px-4 py-2 text-black bg-green-200 rounded-lg cursor-pointer hover:opacity-75 hover:shadow-lg active:opacity-50"
        >
          前往登入
        </button>
			</div>
			<!-- 驗證失敗 -->
			<div class="text-center">
				<div class="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
          <i class="text-2xl text-red-500 fas fa-times"></i>
        </div>
				<h2 class="mb-2 text-xl font-semibold text-gray-800">驗證失敗！</h2>
				<p class="mb-6 text-gray-600">{{ errorMessage }}</p>
				<div class="flex justify-center gap-4">
          <button 
            class="px-4 py-2 text-black bg-green-200 rounded-lg cursor-pointer hover:opacity-75 hover:shadow-lg active:opacity-50"
          >
            返回登入頁
          </button>
          <button 
            class="px-4 py-2 text-black bg-red-200 rounded-lg cursor-pointer hover:opacity-75 hover:shadow-lg active:opacity-50"
          >
            重寄驗證信
          </button>
				</div>
			</div>
			<!-- 無效連結 -->
			<div></div>
			<!-- 重新寄送驗證信表單 -->
			<div></div>
		</div>
	</div>
</template>