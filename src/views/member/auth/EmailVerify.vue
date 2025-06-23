<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
		<div class="max-w-md w-full mx-auto p-6 bg-white rounded-xl shadow-lg">

			<!-- 載入中狀態 -->
      <div v-if="isVerifying" class="text-center">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-secondary-green)] mx-auto mb-4"></div>
        <h2 class="text-xl text-gray-700 mb-2">驗證中...</h2>
        <p class="text-gray-500">請稍候，正在驗證您的信箱</p>
			</div>

			<!-- 驗證成功 -->
			<div></div>
			<!-- 驗證失敗 -->
			<div></div>
			<!-- 無效連結 -->
			<div></div>
			<!-- 重新寄送驗證信表單 -->
			<div></div>
		</div>
	</div>
</template>