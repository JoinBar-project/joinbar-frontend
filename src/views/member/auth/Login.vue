<template>
  <div class="flex justify-center items-start pt-10 min-h-[calc(100vh-6rem)]">
    <div class="relative max-w-[424px] mx-auto p-6 bg-[var(--color-black)] rounded-xl shadow-xl">
    
    <transition name="alert-slide">
      <div v-if="showLoginSuccess" role="alert" class="alert alert-success alert-soft absolute -top-8 left-0 right-0 z-10">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>登入成功！歡迎回來</span>
      </div>
    </transition>
    
    <div class="flex border-b border-[var(--color-icon-secondary)]">
      <button
        class="flex-1 py-2 text-center font-semibold border-b-3 border-[var(--color-secondary-green)] text-[var(--color-secondary-green)]">
        會員登入
      </button>
      <router-link to="/register" class="flex-1 py-2 text-center font-semibold text-[var(--color-icon-secondary)] hover:text-[var(--color-secondary-green)] transition">
        註冊
      </router-link>
    </div>

    <div v-if="isLogin" class="mt-6 space-y-4">
    <!-- 一般登入表單 -->
    <div class="space-y-1">
      <div 
      :class="[
        'flex items-center border rounded px-3 py-2 transition-colors',
        errors.email 
          ? 'border-[var(--color-primary-orange)] border-2 bg-white'
          : 'border-[var(--color-icon-secondary)]'
      ]">
      <i class="fa-solid fa-envelope mr-2"
        :class="errors.email ? 'text-[var(--color-black)]' : 'text-[var(--color-icon-secondary)]'">
      </i>

      <input 
        type="email" 
        placeholder="電子郵件" 
        v-model="loginForm.email"
        @input="clearError('email')"
        :disabled="authStore.isLoading"
        :class="[
          'w-full outline-none placeholder-opacity-70 transition-colors text-sm ml-2',
          errors.email 
            ? 'text-[var(--color-primary-orange)] placeholder-[var(--color-primary-orange)]' 
            : 'text-[var(--color-secondary-green)] placeholder-[var(--color-secondary-green)]'
        ]"/>
      </div>

          <div v-if="errors.email" class="text-[var(--color-primary-orange)] text-xs ml-1">
            {{ emailErrorMessage }}
          </div>
        </div>

        <div class="space-y-1">
          <div 
            :class="[
              'relative flex items-center border rounded px-3 py-2 transition-colors',
              errors.password 
                ? 'border-[var(--color-primary-orange)] border-2 bg-white'
                : 'border-[var(--color-icon-secondary)]'
            ]">
            <i class="fa-solid fa-key mr-2" 
            :class="errors.password ? 'text-[var(--color-black)]' : 'text-[var(--color-icon-secondary)]'">
            </i>
            <input 
              :type="showPassword ? 'text' : 'password'" 
              placeholder="密碼" 
              v-model="loginForm.password"
              @input="clearError('password')"
              :class="[
                'w-full outline-none placeholder-opacity-70 transition-colors text-sm ml-2',
                errors.password 
                  ? 'text-[var(--color-primary-orange)] placeholder-[var(--color-primary-orange)]' 
                  : 'text-[var(--color-secondary-green)] placeholder-[var(--color-secondary-green)]'
              ]"/>
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2"
              :class="errors.password ? 'text-[var(--color-black)]' : 'text-[var(--color-icon-secondary)]'"
              @click="showPassword = !showPassword">
              <i :class="showPassword ? 'fa-regular fa-eye' : 'fa-regular fa-eye-slash'"></i>
            </button>
          </div>

          <div v-if="errors.password" class="text-[var(--color-primary-orange)] text-xs  ml-1">
            {{ passwordErrorMessage }}
          </div>
        </div>
      </div>
      
      <div class="text-xs text-right mt-1 text-[var(--color-primary-orange)] cursor-pointer hover:underline underline-offset-4">
        忘記密碼？
      </div>
      <div class="flex items-center my-4">
        <div class="flex-grow h-px bg-gray-300"></div>
        <span class="px-4 text-gray-300 text-sm">或</span>
        <div class="flex-grow h-px bg-gray-300"></div>
      </div>

      <div class="flex space-x-2 justify-center mt-4">
        <button class="btn bg-white text-black border-[#e5e5e5] border-2 flex items-center px-4 py-2 rounded-lg hover:scale-105 transition">
          <img src="/google.svg" alt="Google logo" class="w-5 h-5 mr-2" />
          Login with Google
        </button>

        <button 
          @click="handleLineLogin"
          :disabled="authStore.isLoading"
        class="btn bg-[var(--color-line-green)] text-white border-[var(--color-line-green-dark)] border-2 flex items-center px-4 py-2 rounded-lg hover:scale-105 transition">
          <img src="/line.svg" alt="Line logo" class="w-5 h-5 mr-2" />
          <span v-if="authStore.isLineLoading">載入中...</span>
          <span v-else>Login with LINE</span>
        </button>
      </div>

      <!-- 登入按鈕 -->
      <div class="flex justify-center">
        <button
          @click="handleLogin"
          :disabled="authStore.isLoading"
          class="w-full max-w-[180px] py-2 bg-gradient-to-r from-[var(--color-secondary-green)] via-[#d8dbaf] to-[var(--color-primary-orange)] text-[var(--color-black)] rounded-lg font-semibold mt-4 shadow-md transition duration-300 transform hover:scale-105 hover:brightness-110 hover:shadow-lg">
          <span v-if="authStore.isEmailLoading">登入中...</span>
          <span v-else>登入</span>
        </button>
      </div>

      <div class="text-center mt-2 text-sm text-[var(--color-primary-orange)] underline underline-offset-4 cursor-pointer hover:text-[var(--color-secondary-green)] transition"
            @click="useTestAccount">
        後台管理員登入
      </div>

      <div class="text-center mt-4 pt-4 border-t border-gray-300">
        <span class="text-sm text-gray-300">還沒有帳號？</span>
        <router-link to="/register" class="text-sm text-[var(--color-secondary-green)] hover:underline underline-offset-4">
          立即註冊
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore'
import Swal from 'sweetalert2';

const authStore = useAuthStore()
const router = useRouter();

const isLogin = ref(true);
const showPassword = ref(false);
const showLoginSuccess = ref(false)

const loginForm = ref({
  email: '',
  password: ''
});

// 紀錄每個欄位是否有錯誤
const errors = ref({
  email: false,
  password: false
})

// 錯誤訊息
const emailErrorMessage = ref('')
const passwordErrorMessage = ref('')

const validateEmail = (email) => {
  if (!email || email.trim() === '') {
    emailErrorMessage.value = '電子郵件為必填欄位'
    return false
  }
  
  if (!email.includes('@')) {
    emailErrorMessage.value = '電子郵件格式不正確，必須包含@符號'
    return false
  }
  
  const hasEnglish = /[a-zA-Z]/.test(email)
  if (!hasEnglish) {
    emailErrorMessage.value = '電子郵件必須包含英文字母'
    return false
  }
  
  return true
}

// 驗證密碼格式
const validatePassword = (password) => {
  if (!password || password.trim() === '') {
    passwordErrorMessage.value = '密碼為必填欄位'
    return false
  }
  
  if (password.length < 8) {
    passwordErrorMessage.value = '密碼至少需要8個字元'
    return false
  }

  const hasEnglish = /[a-zA-Z]/.test(password)
  if (!hasEnglish) {
    passwordErrorMessage.value = '密碼必須包含英文字母'
    return false
  }
  
  const hasNumber = /\d/.test(password)
  if (!hasNumber) {
    passwordErrorMessage.value = '密碼必須包含數字'
    return false
  }
  
  return true
}

const handleLogin = async () => {
  let valid = true

  if (!validateEmail(loginForm.value.email)) {
    errors.value.email = true
    valid = false
  } else {
    errors.value.email = false
  }

  if (!validatePassword(loginForm.value.password)) {
    errors.value.password = true
    valid = false
  } else {
    errors.value.password = false
  }

  if (!valid) return

  try {
    const success = await authStore.emailLogin(loginForm.value.email, loginForm.value.password)
    
    if (success) {
      showLoginSuccess.value = true

      loginForm.value.email = ''
      loginForm.value.password = ''

      setTimeout(() => {
        showLoginSuccess.value = false
        router.push('/home')
      }, 1500)
    }

  } catch (error) {
    console.error('登入過程發生錯誤:', error)
    showLoginSuccess.value = false
  }
}

const handleLineLogin = async () => {
  await authStore.lineLogin()
}

// 清除單一欄位的錯誤狀態
const clearError = (fieldName) => {
  if (errors.value[fieldName]) {
    errors.value[fieldName] = false
  }
}

const useTestAccount = () => {
  loginForm.value.email = 'admin@test.com'
  loginForm.value.password = 'Aa201201'

  // 清除所有錯誤狀態
  errors.value.email = false
  errors.value.password = false

  Swal.fire({
    title: '測試帳號已填入',
    text: '已自動填入測試用的電子郵件和密碼',
    icon: 'info',
    confirmButtonText: '確認'
  })
}

// 組件掛載時檢查 LINE 登入狀態
onMounted(async () => {
  // 初始化 store
  authStore.init()
  // 檢查 LINE 登入回調
  const result = await authStore.checkLineCallback()
  if (result?.success) {
    router.push(result.redirect)
  }
})
</script>

<style scoped>
/* 通知動畫 */
.alert-slide-enter-active {
  transition: all 0.4s ease-out;
}
.alert-slide-leave-active {
  transition: all 0.2s ease-in;
}
.alert-slide-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}
.alert-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>