import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';
import Swal from 'sweetalert2';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null); 
  const accessToken = ref(null);
  const refreshToken = ref(null);
  const isEmailLoading = ref(false);
  const isLineLoading = ref(false);
  const errorMessage = ref('');

  const isAuthenticated = computed(() => !!accessToken.value);
  const currentUser = computed(() => user.value);
  const isLoading = computed(() => isEmailLoading.value || isLineLoading.value);

  const setLoading = (type, value) => {
    switch (type) {
      case 'email':
        isEmailLoading.value = value;
        break;
      case 'line':
        isLineLoading.value = value;
        break;
      default:
        console.warn(`未知的 loading 類型: ${type}`);
    }
  };

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

  // 統一的錯誤處理函數
  const handleError = (err, defaultTitle = '操作失敗') => {
    console.error(defaultTitle + ':', err);

    if (err.response) {
      errorMessage.value = err.response.data.error || defaultTitle;

      let title = defaultTitle;
      if (err.response.status === 401) {
        title = '帳號或密碼錯誤';
        errorMessage.value = '請檢查您的電子郵件和密碼是否正確'
      } else if (err.response.status === 500) {
        title = '伺服器發生錯誤'
      }

      return { title, message: errorMessage.value };

    } else if (err.request) {
      errorMessage.value = '網路連線失敗，請檢查網路狀態'
      return { title: '網路發生錯誤!', message: errorMessage.value };

    } else {
      errorMessage.value = '發生未知錯誤，請稍後再試'
      return { title: '發生未知錯誤!', message: errorMessage.value };
    }
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

    setLoading('email', true);

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
      const errorInfo = handleError(err, '登入失敗');

      await Swal.fire({
        title: errorInfo.title,
        text: errorInfo.message,
        icon: 'error',
        confirmButtonText: '確認'
      });

      return false;

    } finally {
      setLoading('email', false);
    }
  }

  // LINE 登入
  async function lineLogin() {
    setLoading('line', true);
    clearError();

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
      const errorInfo = handleError(err, 'LINE 登入失敗');

      await Swal.fire({
        title: errorInfo.title,
        text: errorInfo.message,
        icon: 'error',
        confirmButtonText: '確認'
      });

      return false

    } finally {
      setLoading('line', false);
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
    setLoading
  }
})
