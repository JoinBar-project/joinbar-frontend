<template>
  <div class="max-w-md mx-auto mt-10 p-6 bg-[#f8ecec] rounded-xl shadow-xl">
    <!-- Tabs -->
    <div class="flex border-b border-[#f3c4cc]">
      <button
        class="flex-1 py-2 text-center font-semibold border-b-3 border-[#aa666c] text-[#860914]">
        會員登入
      </button>
      <router-link to="/register" class="flex-1 py-2 text-center font-semibold text-[#b0a89c] hover:text-[#860914] transition">
        註冊
      </router-link>
    </div>

    <div v-if="isLogin" class="mt-6 space-y-4">
    <!-- 一般登入表單 -->
      <div class="space-y-4">
        <div class="flex items-center border border-gray-300 rounded px-3 py-2">
          <i class="fa-solid fa-envelope text-gray-400 mr-2"></i>
          <input 
            v-model="loginForm.email"
            type="email" 
            placeholder="電子郵件" 
            class="w-full outline-none placeholder-[#860914] text-sm text-[#860914] ml-2"
            :disabled="authStore.isLoading"
            />
        </div>
        <div class="relative flex items-center border border-gray-300 rounded px-3 py-2">
          <i class="fa-solid fa-key text-gray-400 mr-2"></i>
          <input 
            v-model="loginForm.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="密碼" 
            class="w-full outline-none placeholder-[#860914] text-sm text-[#860914] ml-2"
            :disabled="authStore.isLoading"
            />
          <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" @click="showPassword = !showPassword">
            <i :class="showPassword ? 'fa-regular fa-eye' : 'fa-regular fa-eye-slash'"></i>
          </button>
        </div>
      </div>
      
      <div class="text-sm text-right mt-1 text-[#860914] cursor-pointer hover:underline">
        忘記密碼？
      </div>
      <div class="flex items-center my-4">
        <div class="flex-grow h-px bg-gray-400"></div>
        <span class="px-4 text-[#aa666c] text-sm">或</span>
        <div class="flex-grow h-px bg-gray-400"></div>
      </div>

      <!-- 第三方登入 -->
      <div class="flex space-x-2 justify-center mt-4">
        <button class="btn bg-white text-black border-[#e5e5e5] border-2 flex items-center px-4 py-2 rounded-lg hover:shadow-md transition">
          <img src="/google.svg" alt="Google logo" class="w-5 h-5 mr-2" />
          Login with Google
        </button>
        <button 
          @click="handleLineLogin"
          :disabled="authStore.isLoading"
          class="btn bg-[#03C755] text-white border-[#00b544] flex items-center px-4 py-2 rounded-lg hover:bg-[#00b544] hover:shadow-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <img src="/line.svg" alt="Line logo" class="w-5 h-5 mr-2" />
          <span v-if="authStore.isLineLoading">載入中...</span>
          <span v-else>Login with LINE</span>
        </button>
      </div>

      <!-- 登入按鈕 -->
      <div class="flex justify-center">
        <button
          @click="handleEmailLogin"
          :disabled="authStore.isLoading || !loginForm.email || !loginForm.password"
          class="w-full max-w-[180px] py-2 hover:bg-[#aa666c] hover:text-[#3A3435] bg-[#860914] text-[#ffffff] rounded-lg font-semibold mt-4 shadow-md hover:shadow-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
          <span v-if="authStore.isEmailLoading">登入中...</span>
          <span v-else>登入</span>
        </button>
      </div>

      <!-- 測試帳號登入 -->
      <div class="text-center mt-2 text-sm text-[#860914] underline underline-offset-4 cursor-pointer hover:text-[#aa666c] transition"
            @click="useTestAccount">
        後台管理員登入
      </div>

      <!-- 註冊提示 -->
      <div class="text-center mt-4 pt-4 border-t border-gray-300">
        <span class="text-sm text-gray-600">還沒有帳號？</span>
        <router-link to="/register" class="text-sm text-[#860914] hover:underline ml-1">
          立即註冊
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/api/auth'
import Swal from 'sweetalert2';

const authStore = useAuthStore()
const router = useRouter();

const isLogin = ref(true);
const showPassword = ref(false);

const loginForm = ref({
  email: '',
  password: ''
});

// Email 登入處理
const handleEmailLogin = async () => {
  const success = await authStore.emailLogin(loginForm.value.email, loginForm.value.password)
  
  if (success) {
    // 清除表單
    loginForm.value.email = ''
    loginForm.value.password = ''
    // 跳轉到首頁
    router.push('/home')
  }
}

// LINE 登入處理
const handleLineLogin = async () => {
  await authStore.lineLogin()
}

// 測試帳號功能
const useTestAccount = () => {
  loginForm.value.email = 'admin@test.com'
  loginForm.value.password = 'admin123'
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

</style>