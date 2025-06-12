<template>
  <div class="max-w-md mx-auto mt-10 p-6 bg-[#f8ecec] rounded-xl shadow-xl">
    <!-- Tabs -->
    <div class="flex border-b border-[#f3c4cc]">
      <button
        class="flex-1 py-2 text-center font-semibold border-b-3 border-[#aa666c] text-[var(--color-primary-red)]">
        會員登入
      </button>
      <router-link to="/register" class="flex-1 py-2 text-center font-semibold text-[#b0a89c] hover:text-[var(--color-primary-red)] transition">
        註冊
      </router-link>
    </div>

    <!-- 登入表單 -->
    <div class="mt-6 space-y-4">
      <div class="space-y-4">
        <div class="space-y-1">
          <div 
            :class="[
              'flex items-center border rounded px-3 py-2 transition-colors',
              errors.email 
                ? 'border-red-500 bg-red-50' 
                : 'border-gray-400'
            ]">
            <i class="fa-solid fa-envelope text-[var(--color-black)] mr-2"></i>
            <input 
              type="email" 
              placeholder="電子郵件" 
              v-model="loginForm.email"
              @input="clearError('email')"
              :class="[
                'w-full outline-none placeholder-opacity-70 transition-colors text-sm ml-2',
                errors.email 
                  ? 'text-red-600 placeholder-red-400' 
                  : 'text-[var(--color-primary-red)] placeholder-[var(--color-primary-red)]'
              ]"/>
          </div>
          <!-- 錯誤提示文字 -->
          <div v-if="errors.email" class="text-red-500 text-xs ml-1">
            電子郵件為必填欄位
          </div>
        </div>

        <div class="space-y-1">
          <div 
            :class="[
              'relative flex items-center border rounded px-3 py-2 transition-colors',
              errors.password 
                ? 'border-red-500 bg-red-50' 
                : 'border-gray-400'
            ]">
            <i class="fa-solid fa-key mr-2" style="color: var(--color-black);"></i>
            <input 
              :type="showPassword ? 'text' : 'password'" 
              placeholder="密碼" 
              v-model="loginForm.password"
              @input="clearError('password')"
              :class="[
                'w-full outline-none placeholder-opacity-70 transition-colors text-sm ml-2',
                errors.password 
                  ? 'text-red-600 placeholder-red-400' 
                  : 'text-[var(--color-primary-red)] placeholder-[var(--color-primary-red)]'
              ]"/>
            <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" @click="showPassword = !showPassword">
              <i :class="showPassword ? 'fa-regular fa-eye' : 'fa-regular fa-eye-slash'"></i>
            </button>
          </div>
          <!-- 錯誤提示文字 -->
          <div v-if="errors.password" class="text-red-500 text-xs ml-1">
            密碼為必填欄位
          </div>
        </div>
      </div>
      
      <div class="text-sm text-right mt-1 text-[var(--color-primary-red)] cursor-pointer hover:underline">
        忘記密碼？
      </div>

      <div class="flex items-center my-4">
        <div class="flex-grow h-px bg-gray-400"></div>
        <span class="px-4 text-[var(--color-primary-red)] text-sm">或</span>
        <div class="flex-grow h-px bg-gray-400"></div>
      </div>

      <!-- 第三方登入 -->
      <div class="flex space-x-2 justify-center mt-4">
        <button class="btn bg-white text-black border-[#e5e5e5] border-2 flex items-center px-4 py-2 rounded-lg hover:shadow-md transition">
          <img src="/google.svg" alt="Google logo" class="w-5 h-5 mr-2" />
          Login with Google
        </button>
        <button class="btn bg-[#03C755] text-white border-[#00b544] flex items-center px-4 py-2 rounded-lg hover:shadow-md transition">
          <img src="/line.svg" alt="Line logo" class="w-5 h-5 mr-2" />
          Login with LINE
        </button>
      </div>

      <!-- 登入按鈕 -->
      <div class="flex justify-center">
        <button
          @click="handleLogin"
          class="w-full max-w-[180px] py-2 hover:bg-[#aa666c] hover:text-[#3A3435] bg-[var(--color-primary-red)] text-[#ffffff] rounded-lg font-semibold mt-4 shadow-md hover:shadow-lg transition duration-200">
          登入
        </button>
      </div>

      <!-- 測試帳號登入 -->
      <div class="text-center mt-2 text-sm text-[var(--color-primary-red)] underline underline-offset-4 cursor-pointer hover:text-[#aa666c] transition"
            @click="useTestAccount">
        後台管理員登入
      </div>

      <!-- 註冊提示 -->
      <div class="text-center mt-4 pt-4 border-t border-gray-300">
        <span class="text-sm text-gray-600">還沒有帳號？</span>
        <router-link to="/register" class="text-sm text-[var(--color-primary-red)] hover:underline ml-1">
          立即註冊
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const showPassword = ref(false)

const loginForm = ref({
  email: '',
  password: ''
})

// 紀錄每個欄位是否有錯誤
const errors = ref({
  email: false,
  password: false
})

// 清除單一欄位的錯誤狀態
const clearError = (fieldName) => {
  if (errors.value[fieldName]) {
    errors.value[fieldName] = false
  }
}

const handleLogin = () => {
  let valid = true
  
  // 檢查電子郵件
  if (!loginForm.value.email || loginForm.value.email.trim() === '') {
    errors.value.email = true
    valid = false
  } else {
    errors.value.email = false
  }
  
  // 檢查密碼
  if (!loginForm.value.password || loginForm.value.password.trim() === '') {
    errors.value.password = true
    valid = false
  } else {
    errors.value.password = false
  }
  
  // 如果有錯誤就不進行登入
  if (!valid) {
    return
  }
  
  console.log('登入資料：', loginForm.value)
  // 這裡可以加入 API 呼叫
  alert('登入成功！')
}

const useTestAccount = () => {
  loginForm.value.email = 'admin@test.com'
  loginForm.value.password = 'admin123'
  // 清除所有錯誤狀態
  errors.value.email = false
  errors.value.password = false
  alert('已填入測試帳號')
}
</script>