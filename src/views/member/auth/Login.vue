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
          @click="lineLogin"
          :disabled="isLoading"
          class="btn bg-[#03C755] text-white border-[#00b544] flex items-center px-4 py-2 rounded-lg hover:bg-[#00b544] hover:shadow-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <img src="/line.svg" alt="Line logo" class="w-5 h-5 mr-2" />
          <span v-if="isLineLoading">載入中...</span>
          <span v-else>Login with LINE</span>
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
import Swal from 'sweetalert2';
import axios from 'axios';
import { useRouter } from 'vue-router';

const router = useRouter();
const isLogin = ref(true);
const showPassword = ref(false);
const isLoading = ref(false);
const isEmailLoading = ref(false);
const errorMessage = ref('');
const isLineLoading = ref(false);

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

axios.defaults.withCredentials = true;

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

// LINE 登入
const lineLogin = async () => {
  isLineLoading.value = true;
  isLoading.value = true;
  errorMessage.value = '';

  try {
    // 1. 取得 LINE 授權 URL
    const resp = await axios.get(`${API_BASE_URL}/auth/line/url`)
    console.log('LINE 授權 URL 取得成功:', resp.data)

    if (resp.data.authUrl) {
      // 2. 跳轉到 LINE 授權頁面
      window.location.href = resp.data.authUrl
    } else {
      throw new Error('無法取得 LINE 授權連結')
    }
  } catch(err) {
    console.error('LINE 登入失敗:', err)

    if(err.response) {
      errorMessage.value = err.response.data.error || 'LINE 登入失敗'
      Swal.fire({
        title: '發生未知錯誤!',
        text: errorMessage.value,
        icon: 'error',
        confirmButtonText: '確認'
      });
    } else if(err.request) {
      errorMessage.value = '網路連線失敗，請檢查網路狀態'
      Swal.fire({
        title: '網路發生錯誤!',
        text: errorMessage.value,
        icon: 'error',
        confirmButtonText: '確認'
      });
    } else {
      errorMessage.value = 'LINE 登入發生錯誤，請稍後再試'
      Swal.fire({
        title: '發生未知錯誤!',
        text: errorMessage.value,
        icon: 'error',
        confirmButtonText: '確認'
      });
    }
  } finally {
    isLineLoading.value = false;
    isLoading.value = false;
  }
}

// 檢查是否從 LINE 登入回調返回
const checkLineCallback = async () => {
  const urlParams = new URLSearchParams(window.location.search)
  const success = urlParams.get('success')
  const error = urlParams.get('error')
  
  if (success === 'true') {
    // LINE 登入成功
    await Swal.fire({
      title: 'LINE 登入成功!',
      text: '歡迎使用 LINE 登入',
      icon: 'success',
      confirmButtonText: '開始使用'
    })
    // 清除 URL 參數並跳轉到首頁
    window.history.replaceState({}, document.title, window.location.pathname)
    router.push('/home')
  } else if(error) {
    // LINE 登入失敗
    const errorMsg = decodeURIComponent(error);
    errorMessage.value = errorMsg;
    // 加入錯誤彈窗
    await Swal.fire({
      title: 'LINE 登入失敗',
      text: errorMsg,
      icon: 'error',
      confirmButtonText: '確認'
    });
    // 清除 URL 參數
    window.history.replaceState({}, document.title, window.location.pathname)
  }
}

// 測試帳號功能 (來自 dev 分支)
const useTestAccount = () => {
  loginForm.value.email = 'admin@test.com'
  loginForm.value.password = 'admin123'
  Swal.fire({
    title: '測試帳號已填入',
    text: '已自動填入測試用的電子郵件和密碼',
    icon: 'info',
    confirmButtonText: '確認'
  });
}

// 組件掛載時檢查 LINE 登入狀態
onMounted(() => {
  checkLineCallback()
});
</script>

<style scoped>

</style>