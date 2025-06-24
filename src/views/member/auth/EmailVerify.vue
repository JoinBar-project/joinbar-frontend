<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isVerifying = ref(false)
const verificationResult = ref(null)
const errorMessage = ref('')
const showResendForm = ref(false)
const resendEmail = ref('')
const isResending = ref(false)

const verifyEmailToken = async () => {
  const token = route.query.token
  
  if (!token) {
    verificationResult.value = 'invalid'
    errorMessage.value = '無效的驗證連結'
    return
  }

  isVerifying.value = true
  
  try {
    const result = await authStore.verifyEmail(token)
    
    if (result.success) {
      verificationResult.value = 'success'
    } else {
      verificationResult.value = 'failed'
      errorMessage.value = result.error || '驗證失敗'
    }
  } catch (err) {
    verificationResult.value = 'failed'
    errorMessage.value = '驗證過程發生錯誤'
  } finally {
    isVerifying.value = false
  }
}

const handleResendEmail = async () => {
  if (!resendEmail.value) {
    return
  }
  
  isResending.value = true
  
  try {
    await authStore.handleResendVerification(resendEmail.value)
    showResendForm.value = false
    resendEmail.value = ''
  } catch (err) {
    console.error('重新寄送失敗:', err)
  } finally {
    isResending.value = false
  }
}

const goToLogin = () => {
  router.push('/login')
}

onMounted(() => {
  verifyEmailToken()
})
</script>

<template>
  <div class="flex items-center justify-center min-h-screen px-3 md:px-4 bg-gray-50">
		<div class="w-full max-w-md p-4 mx-auto bg-white shadow-lg md:p-6 rounded-xl">

			<!-- 載入中狀態 -->
      <div v-if="isVerifying" class="text-center">
				<div class="animate-spin rounded-full h-10 md:h-12 w-10 md:w-12 border-b-2 border-[var(--color-secondary-green)] mx-auto mb-3 md:mb-4"></div>
        <h2 class="mb-2 text-lg font-semibold text-gray-800 md:text-xl">驗證中...</h2>
        <p class="text-sm text-gray-500 md:text-base">請稍候，正在驗證您的信箱</p>
			</div>

			<!-- 驗證成功 -->
			<div v-else-if="verificationResult === 'success'" class="text-center">
				<div class="flex items-center justify-center mx-auto mb-3 bg-green-100 rounded-full w-14 md:w-16 h-14 md:h-16 md:mb-4">
          <i class="text-xl text-green-500 md:text-2xl fas fa-check"></i>
        </div>
				<h2 class="mb-2 text-lg font-semibold text-gray-800 md:text-xl">驗證成功！</h2>
				<p class="mb-4 text-sm text-gray-600 md:mb-6 md:text-base">您的信箱已成功驗證，現在可以正常使用所有功能了</p>
				<button
          @click="goToLogin"
          class="w-full px-4 py-2.5 md:py-2 text-sm md:text-base text-black bg-green-200 rounded-lg cursor-pointer hover:opacity-75 hover:shadow-lg active:opacity-50 transition-all duration-200"
        >
          前往登入
        </button>
			</div>

			<!-- 驗證失敗 -->
			<div v-else-if="verificationResult === 'failed' && !showResendForm" class="text-center">
				<div class="flex items-center justify-center mx-auto mb-3 bg-red-100 rounded-full w-14 md:w-16 h-14 md:h-16 md:mb-4">
          <i class="text-xl text-red-500 md:text-2xl fas fa-times"></i>
        </div>
				<h2 class="mb-2 text-lg font-semibold text-gray-800 md:text-xl">驗證失敗！</h2>
				<p class="mb-4 text-sm text-gray-600 md:mb-6 md:text-base">{{ errorMessage }}</p>
				<div class="flex flex-col justify-center gap-2 md:flex-row md:gap-4">
          <button
            @click="goToLogin"
            class="w-full md:w-auto px-4 py-2.5 md:py-2 text-sm md:text-base text-black bg-green-200 rounded-lg cursor-pointer hover:opacity-75 hover:shadow-lg active:opacity-50 transition-all duration-200"
          >
            返回登入頁
          </button>
          <button 
            @click="showResendForm = true"
            class="w-full md:w-auto px-4 py-2.5 md:py-2 text-sm md:text-base text-black bg-red-200 rounded-lg cursor-pointer hover:opacity-75 hover:shadow-lg active:opacity-50 transition-all duration-200"
          >
            重寄驗證信
          </button>
				</div>
			</div>

			<!-- 無效連結 -->
			<div v-else class="text-center">
				<div class="flex items-center justify-center mx-auto mb-3 bg-yellow-100 rounded-full w-14 md:w-16 h-14 md:h-16 md:mb-4">
          <i class="text-xl text-yellow-500 md:text-2xl fas fa-exclamation-triangle"></i>
        </div>
				<h2 class="mb-2 text-lg font-semibold text-gray-800 md:text-xl">無效的驗證連結！</h2>
				<p class="mb-4 text-sm text-gray-600 md:mb-6 md:text-base">此連結可能已過期或無效</p>
				<button
          @click="goToLogin"
          class="w-full px-4 py-2.5 md:py-2 text-sm md:text-base text-black bg-green-200 rounded-lg cursor-pointer hover:opacity-75 hover:shadow-lg active:opacity-50 transition-all duration-200"
        >
          返回登入頁
        </button>
			</div>

			<!-- 重新寄送驗證信表單 -->
			<div v-if="verificationResult === 'failed' && showResendForm" class="mt-3 text-center md:mt-4">
        <h3 class="mb-3 text-base font-semibold md:text-lg">重新寄送驗證信</h3>
        <div class="space-y-3">
          <input
            v-model="resendEmail"
            type="email"
            placeholder="請輸入您的信箱"
            class="w-full px-3 py-2.5 md:py-2 text-sm md:text-base border border-gray-300 rounded-lg focus:outline-none focus:border-[var(--color-secondary-green)] transition-colors duration-200"
          />
          <div class="flex flex-col justify-center gap-2 md:flex-row md:gap-4"> 
            <button
              @click="handleResendEmail"
							:disabled="!resendEmail || isResending"
              class="w-full md:w-auto px-4 py-2.5 md:py-2 text-sm md:text-base text-black bg-green-200 rounded-lg cursor-pointer hover:opacity-75 hover:shadow-lg active:opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <span v-if="isResending">寄送中...</span>
              <span v-else>重新寄送</span>
            </button>
            <button
							@click="showResendForm = false"
              class="w-full md:w-auto px-4 py-2.5 md:py-2 text-sm md:text-base text-black bg-red-200 rounded-lg cursor-pointer hover:opacity-75 hover:shadow-lg active:opacity-50 transition-all duration-200"
						>
              取消
            </button>
          </div>
        </div>
      </div>
		</div>
	</div>
</template>