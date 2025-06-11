<template>
  <div class="max-w-md mx-auto mt-10 p-6 bg-[#f8ecec] rounded-xl shadow-xl">
    <!-- Tabs -->
    <div class="flex border-b">
      <button
        class="flex-1 py-2 text-center font-semibold"
        :class="isLogin ? 'border-b-3 border-[#aa666c] text-[#860914]' : 'text-[#b0a89c]'"
        @click="isLogin = true">會員登入
      </button>
      <button
        class="flex-1 py-2 text-center font-semibold"
        :class="!isLogin ? 'border-b-3 border-[#aa666c] text-[#860914]' : 'text-[#b0a89c]'"
        @click="isLogin = false">註冊
      </button>
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
          :disabled="isLoading"
          />
      </div>

      <div class="relative flex items-center border border-gray-300 rounded px-3 py-2">
        <i class="fa-solid fa-key text-gray-400 mr-2"></i>
        <input 
          v-model="loginForm.password"
          :type="showPassword ? 'text' : 'password'"
          placeholder="密碼" 
          class="w-full outline-none placeholder-[#860914] text-sm text-[#860914] ml-2"
          :disabled="isLoading"
          />
        <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" @click="showPassword = !showPassword">
          <i :class="showPassword ? 'fa-regular fa-eye' : 'fa-regular fa-eye-slash'"></i>
        </button>
      </div>
    </div>
    <div class="text-sm text-right mt-1 text-[#860914]">忘記密碼？</div>

    <div class="flex items-center my-4">
      <div class="flex-grow h-px bg-gray-400"></div>
      <span class="px-4 text-[#aa666c] text-sm">或</span>
      <div class="flex-grow h-px bg-gray-400"></div>
    </div>

      <!-- 第三方登入 -->
      <div class="flex space-x-2 justify-center mt-4">
        <button class="btn bg-white text-black border-[#e5e5e5] border-2  ">
          <img src="/google.svg" alt="Google logo" class="w-5 h-5 mr-2" />
        Login with Google
      </button>
        <button class="btn bg-[#03C755] text-white border-[#00b544]">
          <img src="/line.svg" alt="Line logo" class="w-5 h-5 mr-2" />
          Login with LINE
        </button>
      </div>

      <!-- 登入按鈕 -->
      <div class="flex justify-center">
        <button
          @click="emailLogin"
          :disabled="isLoading || !loginForm.email || !loginForm.password"
          class="w-full max-w-[180px] py-2 hover:bg-[#aa666c] hover:text-[#3A3435] bg-[#860914] text-[#ffffff] rounded-lg font-semibold mt-4 shadow-md hover:shadow-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
          <span v-if="isEmailLoading">登入中...</span>
          <span v-else>登入</span>
        </button>
      </div>

    

      <!-- 測試帳號登入 -->
      <div class="text-center mt-2 text-sm text-[#860914] underline underline-offset-4 cursor-pointer">
        使用測試帳號登入
      </div>
    </div>

    <!-- 註冊表單跳轉 -->
    <div v-else class="mt-6 text-center text-gray-400">
      xxx
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Swal from 'sweetalert2';
import axios from 'axios';
import { useRouter } from 'vue-router';

const router = useRouter();

const isLogin = ref(true);
const showPassword = ref(false);
const isLoading = ref(false);
const isEmailLoading = ref(false);
const isLineLoading = ref(false);
const errorMessage = ref('')

const loginForm = ref({
  email: '',
  password: ''
});

const clearError = () => {
  errorMessage.value = '';
};

const ACCESS_TOKEN_NAME = 'access_token';
const REFRESH_TOKEN_NAME = 'refresh_token';

const API_BASE_URL = 'http://localhost:3000/api';

axios.defaults.withCredentials = true

// 一般 Email 登入
const emailLogin = async () => {
  clearError();
  if(loginForm.value.email && loginForm.value.password) {
    isEmailLoading.value = true;
    isLoading.value = true;
    const url = `${API_BASE_URL}/auth/login`;
    const userData = {
      email: loginForm.value.email,
      password: loginForm.value.password
    }
    try {
      const resp = await axios.post(url, userData);
      console.log('登入成功:', resp.data);
      const accessToken = resp.data.accessToken;
      const refreshToken = resp.data.refreshToken;
      localStorage.setItem(ACCESS_TOKEN_NAME, accessToken);
      localStorage.setItem(REFRESH_TOKEN_NAME, refreshToken);
      localStorage.setItem('user', JSON.stringify(resp.data.user));
      loginForm.value.email = '';
      loginForm.value.password = '';
      isLogin.value = true;
      await Swal.fire({
        title: '登入成功!',
        icon: 'success',
        confirmButtonText: '開始使用'
      });
      router.push('/home');
    } catch(err) {
      console.error('登入失敗:', err);

      if (err.response) {
        // 伺服器回傳的錯誤
        errorMessage.value = err.response.data.error || '登入失敗';
        
        let title = '登入失敗';
        if (err.response.status === 401) {
          title = '帳號或密碼錯誤';
          errorMessage.value = '請檢查您的電子郵件和密碼是否正確';
        } else if (err.response.status === 500) {
          title = '伺服器發生錯誤';
        }

        Swal.fire({
          title: title,
          text: errorMessage.value,
          icon: 'error',
          confirmButtonText: '確認'
        });

      } else if (err.request) {
        // 網路錯誤（無法連接到伺服器）
        errorMessage.value = '網路連線失敗，請檢查網路狀態';
        Swal.fire({
          title: '網路發生錯誤!',
          text: errorMessage.value,
          icon: 'error',
          confirmButtonText: '確認'
        });

      } else {
        // 其他錯誤
        errorMessage.value = '發生未知錯誤，請稍後再試';
        Swal.fire({
          title: '發生未知錯誤!',
          text: errorMessage.value,
          icon: 'error',
          confirmButtonText: '確認'
        });
      }

    } finally {
      isEmailLoading.value = false;
      isLoading.value = false;
    }

  } else {
    // 表單驗證失敗
    Swal.fire({
      title: '請填寫完整資訊',
      text: '請輸入電子郵件和密碼',
      icon: 'warning',
      confirmButtonText: '確認'
    });
  }
};

</script>

<style scoped>

</style>



