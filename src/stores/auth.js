import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';
import Swal from 'sweetalert2';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null); 
  const accessToken = ref(null);
  const refreshToken = ref(null);
  const isLoading = ref(false);
  const isEmailLoading = ref(false);
  const isLineLoading = ref(false);
  const errorMessage = ref('');

  const isAuthenticated = computed(() => !!accessToken.value);
  const currentUser = computed(() => user.value);

  function init() {
    const storedAccessToken = localStorage.getItem('access_token');
    const storedRefreshToken = localStorage.getItem('refresh_token');
    const storedUser = localStorage.getItem('user');

    if (storedAccessToken) {
      accessToken.value = storedAccessToken;
      refreshToken.value = storedRefreshToken;
      user.value = storedUser ? JSON.parse(storedUser) : null;
    }
  }

  // 清除錯誤訊息
  function clearError() {
    errorMessage.value = ''
  }

  // Email 登入
  async function emailLogin(email, password) {
    clearError();

    if (!email || !password) {
      await Swal.fire({
        title: '請填寫完整資訊',
        text: '請輸入電子郵件和密碼',
        icon: 'warning',
        confirmButtonText: '確認'
      });
      return false;
    }

    isEmailLoading.value = true;
    isLoading.value = true;

    const API_BASE_URL = 'http://localhost:3000/api';
    axios.defaults.withCredentials = true;

    try {
      const resp = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password
      });

      console.log('登入成功:', resp.data);

      // 儲存 token 和用戶資訊
      accessToken.value = resp.data.accessToken;
      refreshToken.value = resp.data.refreshToken;
      user.value = resp.data.user;

      // 同步到 localStorage
      localStorage.setItem('access_token', accessToken.value);
      localStorage.setItem('refresh_token', refreshToken.value);
      localStorage.setItem('user', JSON.stringify(user.value));

      await Swal.fire({
        title: '登入成功!',
        icon: 'success',
        confirmButtonText: '開始使用'
      });

      return true;

    } catch(err) {
      console.error('登入失敗:', err);

      if (err.response) {
        errorMessage.value = err.response.data.error || '登入失敗';

        let title = '登入失敗';
        if (err.response.status === 401) {
          title = '帳號或密碼錯誤';
          errorMessage.value = '請檢查您的電子郵件和密碼是否正確'
        } else if (err.response.status === 500) {
          title = '伺服器發生錯誤'
        }

        await Swal.fire({
          title: title,
          text: errorMessage.value,
          icon: 'error',
          confirmButtonText: '確認'
        })

      } else if (err.request) {
        errorMessage.value = '網路連線失敗，請檢查網路狀態'
        await Swal.fire({
          title: '網路發生錯誤!',
          text: errorMessage.value,
          icon: 'error',
          confirmButtonText: '確認'
        })

      } else {
        errorMessage.value = '發生未知錯誤，請稍後再試'
        await Swal.fire({
          title: '發生未知錯誤!',
          text: errorMessage.value,
          icon: 'error',
          confirmButtonText: '確認'
        })
      }

      return false

    } finally {
      isEmailLoading.value = false
      isLoading.value = false
    }
  }

  // LINE 登入
  async function lineLogin() {
    isLineLoading.value = true;
    isLoading.value = true;
    errorMessage.value = '';

    const API_BASE_URL = 'http://localhost:3000/api';

    try {
      const resp = await axios.get(`${API_BASE_URL}/auth/line/url`)
      console.log('LINE 授權 URL 取得成功:', resp.data)

      if (resp.data.authUrl) {
        window.location.href = resp.data.authUrl
        return true
      } else {
        throw new Error('無法取得 LINE 授權連結')
      }

    } catch(err) {
      console.error('LINE 登入失敗:', err)

      if (err.response) {
        errorMessage.value = err.response.data.error || 'LINE 登入失敗'
      } else if (err.request) {
        errorMessage.value = '網路連線失敗，請檢查網路狀態'
      } else {
        errorMessage.value = 'LINE 登入發生錯誤，請稍後再試'
      }

      await Swal.fire({
        title: 'LINE 登入失敗',
        text: errorMessage.value,
        icon: 'error',
        confirmButtonText: '確認'
      })

      return false

    } finally {
      isLineLoading.value = false
      isLoading.value = false
    }
  }

  // 檢查 LINE 登入回調
  async function checkLineCallback() {
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const error = urlParams.get('error')

    if (success === 'true') {
      await Swal.fire({
        title: 'LINE 登入成功!',
        text: '歡迎使用 LINE 登入',
        icon: 'success',
        confirmButtonText: '開始使用'
      })
      
      window.history.replaceState({}, document.title, window.location.pathname)
      return { success: true, redirect: '/home' }

    } else if (error) {
      const errorMsg = decodeURIComponent(error)
      errorMessage.value = errorMsg

      await Swal.fire({
        title: 'LINE 登入失敗',
        text: errorMsg,
        icon: 'error',
        confirmButtonText: '確認'
      })
      
      window.history.replaceState({}, document.title, window.location.pathname)
      return { success: false }
    }
    
    return null
  }

  return {
    user,
    accessToken,
    refreshToken,
    isLoading,
    isEmailLoading,
    isLineLoading,
    errorMessage,

    isAuthenticated,
    currentUser,

    init,
    clearError,
    emailLogin,
    lineLogin,
    checkLineCallback,
  }
})
