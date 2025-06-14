import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import Swal from 'sweetalert2';
import apiClient from './axios';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null); 
  const accessToken = ref(null);
  const refreshToken = ref(null);
  const isEmailLoading = ref(false);
  const isLineLoading = ref(false);
  const errorMessage = ref('');

  const currentUser = computed(() => user.value);
  const isLoading = computed(() => isEmailLoading.value || isLineLoading.value);

  const isAuthenticated = computed(() => {
  // 有用戶資訊就算已認證（不管是 token 還是 cookie）
  return !!user.value;
});

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

  function clearError() {
    errorMessage.value = ''
  }

// 清除認證狀態攔截器使用
  function clearAuthState() {
    user.value = null;
    accessToken.value = null;
    refreshToken.value = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    clearError();
    console.log('認證狀態已清除');
  }

  // 檢查認證狀態的方法
  async function checkAuthStatus() {
    if (!user.value) {
      return false
    }

    try {
      // 發送一個需要認證的請求來驗證 token
      await apiClient.get('/auth/verify')
      console.log('認證狀態有效')
      return true
    } catch (error) {
      // 攔截器會處理 401 錯誤並清除狀態
      console.warn('認證狀態無效')
      return false
    }
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

  // 重新寄送驗證信的函數
  async function handleResendVerification(email) {
    try {
      // 顯示寄送中的載入畫面
      Swal.fire({
        title: '寄送中...',
        text: '正在重新寄送驗證信，請稍候',
        icon: 'info',
        allowOutsideClick: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      await apiClient.post('/auth/resend-verification', {
        email
      });

      await Swal.fire({
        title: '驗證信已重新寄送！',
        html: `
          <div class="text-left">
            <p class="mb-3">新的驗證信已寄送至：</p>
            <p class="font-mono bg-gray-100 p-2 rounded text-sm mb-3">${email}</p>
            <div class="bg-blue-50 p-3 rounded-lg text-sm">
              <p class="text-blue-700 mb-2">
                <i class="fas fa-info-circle mr-1"></i>
                接下來請：
              </p>
              <ol class="text-blue-600 ml-4 space-y-1">
                <li>1. 檢查您的信箱（包含垃圾信件夾）</li>
                <li>2. 點擊信件中的驗證連結</li>
                <li>3. 驗證完成後即可正常登入</li>
              </ol>
            </div>
            <p class="mt-3 text-gray-600 text-xs">
              <i class="fas fa-clock mr-1"></i>
              驗證連結將在 24 小時後失效
            </p>
          </div>
        `,
        icon: 'success',
        confirmButtonText: '我知道了',
        confirmButtonColor: '#860914',
        width: '500px'
      });

      return true;

    } catch (err) {
      console.error('重新寄送驗證信失敗:', err);
      
      let errorMessage = '重新寄送驗證信失敗，請稍後再試';
      let errorTitle = '寄送失敗';
      
      if (err.response?.status === 429) {
        errorMessage = err.response.data.error || '請稍後再試，不要頻繁寄送驗證信';
        errorTitle = '寄送過於頻繁';
      } else if (err.response?.status === 400 && err.response.data.error?.includes('已經驗證')) {
        errorMessage = '您的信箱已經驗證完成，可以直接登入';
        errorTitle = '信箱已驗證';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }

      await Swal.fire({
        title: errorTitle,
        text: errorMessage,
        icon: errorTitle === '信箱已驗證' ? 'success' : 'error',
        confirmButtonText: '確認'
      });

      return false;
    }
  }

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

    try {
      const resp = await apiClient.post('/auth/login', {
        email,
        password
      });

      console.log('登入成功:', resp.data);

      accessToken.value = resp.data.accessToken;
      refreshToken.value = resp.data.refreshToken;
      user.value = resp.data.user;

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
      //信箱未驗證的情況
      if (err.response?.status === 403 && err.response?.data?.needVerification) {
        const isExpired = err.response.data.tokenExpired;
        
        const result = await Swal.fire({
          title: '信箱尚未驗證',
          html: `
            <div class="text-left">
              <p class="mb-3">無法登入，因為您的信箱尚未完成驗證</p>
              <div class="bg-yellow-50 p-3 rounded-lg text-sm">
                <p class="text-yellow-700 mb-2">
                  <i class="fas fa-lightbulb mr-1"></i>
                  找不到驗證信？請檢查：
                </p>
                <ul class="text-yellow-600 ml-4 space-y-1">
                  <li>• 垃圾信件夾</li>
                  <li>• 促銷郵件夾</li>
                  <li>• 信箱地址是否正確</li>
                </ul>
              </div>
              ${isExpired ? 
                '<p class="mt-3 text-red-600 text-sm"><i class="fas fa-clock mr-1"></i>您的驗證連結已過期</p>' : 
                '<p class="mt-3 text-blue-600 text-sm"><i class="fas fa-envelope mr-1"></i>或者重新寄送新的驗證信</p>'
              }
            </div>
          `,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: '重新寄送驗證信',
          cancelButtonText: '稍後再試',
          confirmButtonColor: '#860914',
          cancelButtonColor: '#6c757d',
          width: '500px'
        });

        if (result.isConfirmed) {
          // 重新寄送驗證信的函數
          await handleResendVerification(email);
        }
        return false;
      }

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

  async function lineLogin() {
    setLoading('line', true);
    clearError();

    try {
      const resp = await apiClient.get('/auth/line/url')
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

  async function checkLineCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');

    if (success === 'true') {
      try {
        // 讀取後端設定的 user_info cookie
        const userInfoCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('user_info='))
          ?.split('=').slice(1).join('=');
        if (userInfoCookie) {
          const userData = JSON.parse(decodeURIComponent(userInfoCookie));
          
          // 更新前端狀態
          user.value = userData;
          // 同步到 localStorage（用於頁面重新整理時快速載入）
          localStorage.setItem('user', JSON.stringify(userData));
          console.log('LINE 登入用戶資訊已同步:', userData);
        }
        await Swal.fire({
          title: 'LINE 登入成功!',
          text: `歡迎 ${user.value?.lineDisplayName || user.value?.username || ''}`,
          icon: 'success',
          confirmButtonText: '開始使用'
        });

        window.history.replaceState({}, document.title, window.location.pathname);
        return { success: true, redirect: '/home' };

      } catch(err) {
        console.error('LINE 登入狀態同步失敗:', err);
        // 即使同步失敗，也顯示成功訊息
        await Swal.fire({
          title: 'LINE 登入成功!',
          text: '歡迎使用 LINE 登入',
          icon: 'success',
          confirmButtonText: '開始使用'
        });

        window.history.replaceState({}, document.title, window.location.pathname);
        return { success: true, redirect: '/home' };
      }

    } else if(error) {
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

  function init() {
    // 嘗試從 localStorage 恢復 Email 登入狀態
    const storedAccessToken = localStorage.getItem('access_token');
    const storedRefreshToken = localStorage.getItem('refresh_token');
    const storedUser = localStorage.getItem('user');

    if (storedAccessToken && storedUser) {
      accessToken.value = storedAccessToken;
      refreshToken.value = storedRefreshToken;
      try {
        user.value = JSON.parse(storedUser);
        console.log('從 localStorage 恢復登入狀態 (Email 登入)');
      } catch(err) {
        console.error('解析用戶資料失敗:', err);
        localStorage.removeItem('user');
      }
    } 
    // 沒有 token 檢查是否有用戶資訊 可能是 LINE 登入
    else if (storedUser) {
      try {
      user.value = JSON.parse(storedUser);
      console.log('從 localStorage 恢復用戶資訊');
    } catch (err) {
      console.error('解析用戶資料失敗:', err);
      localStorage.removeItem('user');
    }
    }

    try {
      const userInfoCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('user_info='))
        ?.split('=').slice(1).join('=');

      if (userInfoCookie) {
        const userData = JSON.parse(decodeURIComponent(userInfoCookie));

        // 如果 cookie 中的用戶與當前用戶不同，更新狀態
        if (!user.value || user.value.id !== userData.id) {
          user.value = userData;
          localStorage.setItem('user', JSON.stringify(userData));
          console.log('從 cookie 更新用戶資訊 (LINE 登入)');
        }
      }
    } catch(err) {
      console.error('從 cookie 讀取用戶資訊失敗:', err);
    }

    // 4. 如果最終沒有用戶資訊，清理所有狀態
    if (!user.value) {
      accessToken.value = null;
      refreshToken.value = null;
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      console.log('清理無效的登入狀態');
    }
  }

  // 也可以區分登入方式
  const loginMethod = computed(() => {
    if (!user.value) return null;
    if (accessToken.value) return 'email';
    return 'line'; // 假設沒有 token 的就是 LINE 登入
  });

  return {
    // 狀態
    user,
    accessToken,
    refreshToken,
    isLoading,
    isEmailLoading,
    isLineLoading,
    errorMessage,

    // 計算屬性
    isAuthenticated,
    currentUser,
    loginMethod,

    // 方法
    init,
    clearError,
    emailLogin,
    lineLogin,
    checkLineCallback,
    setLoading,
    clearAuthState,
    checkAuthStatus,
    handleResendVerification
  }
})