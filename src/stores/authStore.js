import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import Swal from 'sweetalert2';
import { verifyAuth, 
          resendVerification, 
          emaillogin as emailLoginAPI, 
          lineLogin as lineLoginAPI, 
          emailSignup as emailSignupAPI, 
          saveBarTags as saveBarTagsAPI, 
          lineLogout as lineLogoutAPI, 
          verifyEmail as verifyEmailAPI, 
          getAccountDeletionWarning as getAccountDeletionWarningAPI, 
          deleteAccount as deleteAccountAPI,
          getBarTags as getBarTagsAPI,
          updateBarTags as updateBarTagsAPI } from '../api/auth';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const accessToken = ref(null);
  const refreshToken = ref(null);
  const isLoading = ref(false);
  const isEmailLoading = ref(false);
  const isLineLoading = ref(false);
  const errorMessage = ref('');

  const currentUser = computed(() => user.value);
  const isAnyLoading = computed(() => isLoading.value || isEmailLoading.value || isLineLoading.value);
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
    errorMessage.value = '';
  }

  // 清除認證狀態
  function clearAuthState() {
    user.value = null;
    accessToken.value = null;
    refreshToken.value = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    document.cookie = 'user_info=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; sameSite=lax';
    clearError();
    console.log('認證狀態已清除');
  }

// 將更新後的使用者資料同步到 authStore.user 和 localStorage
  function updateAuthUser(updatedData) {
    if (!user.value) return;

    const fieldsToUpdate = ['username', 'nickname', 'birthday', 'avatarUrl'];

    fieldsToUpdate.forEach(field => {
      if (updatedData[field] !== undefined) {
        user.value[field] = updatedData[field];
      }
    });

    localStorage.setItem('user', JSON.stringify(user.value));
  }

  // 檢查認證狀態
  async function checkAuthStatus() {
    if (!user.value) {
      return false;
    }

    try {
      await verifyAuth();
      console.log('認證狀態有效');
      return true;
    } catch (error) {
      // 攔截器會處理 401 錯誤並清除狀態
      console.warn('認證狀態無效');
      return false;
    }
  }

  // 重新寄送驗證信
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
        },
      });

      await resendVerification(email);

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
        width: '500px',
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
        confirmButtonText: '確認',
      });

      return false;
    }
  }

  async function verifyEmail(token) {
  if (!token) {
    return { success: false, error: '缺少驗證 token', type: 'validation' };
  }

  try {
    await verifyEmailAPI(token);

    await Swal.fire({
      title: '驗證成功！',
      html: `
        <div class="text-center">
          <p class="mb-3">您的信箱已成功驗證</p>
          <div class="bg-green-50 p-3 rounded-lg text-sm">
            <p class="text-green-700">
              <i class="fas fa-check-circle mr-1"></i>
              現在您可以正常登入並使用所有功能了
            </p>
          </div>
        </div>
      `,
      icon: 'success',
      confirmButtonText: '前往登入',
      confirmButtonColor: '#860914',
      width: '400px'
    });

    return { success: true, message: '信箱驗證成功', handled: true };

  } catch (err) {
    console.error('信箱驗證失敗:', err);
    
    let errorMessage = '驗證失敗';
    let errorTitle = '驗證失敗';
    let errorType = 'unknown';
    
    if (err.response?.data?.error) {
      errorMessage = err.response.data.error;

      if (errorMessage.includes('已過期')) {
        errorTitle = '驗證連結已過期';
        errorType = 'expired';
      } else if (errorMessage.includes('已經驗證')) {
        errorTitle = '信箱已驗證';
        errorType = 'already_verified';
        
        await Swal.fire({
          title: errorTitle,
          text: '您的信箱已經驗證完成，可以直接登入',
          icon: 'info',
          confirmButtonText: '前往登入',
          confirmButtonColor: '#860914'
        });
        
        return { success: true, message: '信箱已經驗證完成', type: 'already_verified', handled: true };
      } else if (errorMessage.includes('無效')) {
        errorTitle = '無效的驗證連結';
        errorType = 'invalid';
      } else if (errorMessage.includes('缺少')) {
        errorType = 'validation';
      }
    }

    await Swal.fire({
      title: errorTitle,
      text: errorMessage,
      icon: 'error',
      confirmButtonText: '確認'
    });

    return { success: false, error: errorMessage, type: errorType, handled: true };
  }
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
        console.log('從 localStorage 恢復登入狀態 (Email 登入):', user.value);
      } catch (err) {
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
        ?.split('=')
        .slice(1)
        .join('=');

      if (userInfoCookie) {
        const userData = JSON.parse(decodeURIComponent(userInfoCookie));
        console.log('從 cookie 讀取到用戶資訊:', userData);

        // 如果 cookie 中的用戶與當前用戶不同 更新狀態
        if (!user.value || user.value.id !== userData.id) {
          user.value = userData;
          localStorage.setItem('user', JSON.stringify(userData));
          console.log('從 cookie 更新用戶資訊 (LINE 登入):', userData);
        }
      } else if (user.value && !storedAccessToken) {
        // 如果有 localStorage 中的用戶但沒有 cookie，可能是 LINE 登入狀態已失效
        console.log('檢查 LINE 登入狀態...');
      }
    } catch (err) {
      console.error('從 cookie 讀取用戶資訊失敗:', err);
    }

    // 如果最終沒有用戶 清理所有狀態
    if (!user.value) {
      accessToken.value = null;
      refreshToken.value = null;
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      console.log('清理無效的登入狀態');
    } else {
      console.log('AuthStore 初始化完成，用戶:', user.value.username || user.value.lineDisplayName);
    }
  }

  async function emailSignup(userData) {
    clearError();

    if (!userData.username || !userData.email || !userData.password) {
      return { success: false, error: '請填寫完整資訊', type: 'validation' };
    }
    setLoading('email', true);

    try {
      const resp = await emailSignupAPI(userData);
      console.log('註冊成功:', resp.data);

      await Swal.fire({
        title: '註冊成功！',
        html: `
          <div class="text-left">
            <p class="mb-3">帳號建立成功！驗證信已寄送至：</p>
            <p class="font-mono bg-gray-100 p-2 rounded text-sm mb-3">${userData.email}</p>
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
          </div>
        `,
        icon: 'success',
        confirmButtonText: '我知道了',
        confirmButtonColor: '#860914',
        width: '500px'
      });
      return { success: true, handled: true };
    } catch(err) {
      return { success: false, error: err.response?.data?.error || '註冊失敗' };
    } finally {
      setLoading('email', false);
    }  
  }  

  async function emailLogin(email, password) {
    clearError();

    if (!email || !password) {
      return { success: false, error: '請填寫完整資訊', type: 'validation' };
    }

    setLoading('email', true);

    try {
      const resp = await emailLoginAPI(email, password);

      console.log('登入成功:', resp.data);

      accessToken.value = resp.data.accessToken;
      refreshToken.value = resp.data.refreshToken;
      user.value = resp.data.user;

      localStorage.setItem('access_token', accessToken.value);
      localStorage.setItem('refresh_token', refreshToken.value);
      localStorage.setItem('user', JSON.stringify(user.value));

      return { success: true, user: resp.data.user };

    } catch(err) {
      //信箱未驗證
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
              ${
                isExpired
                  ? '<p class="mt-3 text-red-600 text-sm"><i class="fas fa-clock mr-1"></i>您的驗證連結已過期</p>'
                  : '<p class="mt-3 text-blue-600 text-sm"><i class="fas fa-envelope mr-1"></i>或者重新寄送新的驗證信</p>'
              }
            </div>
          `,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: '重新寄送驗證信',
          cancelButtonText: '稍後再試',
          confirmButtonColor: '#860914',
          cancelButtonColor: '#6c757d',
          width: '500px',
        });

        if (result.isConfirmed) {
          // 重新寄送驗證信
          await handleResendVerification(email);
        }
        return { success: false, needVerification: true, handled: true };
      }

      let errorMessage = '登入失敗';
      if (err.response?.status === 401) {
        errorMessage = '電子郵件或密碼錯誤';
      }
  
      return { success: false, error: errorMessage };
    } finally {
      setLoading('email', false);
    }
  }

  async function lineLogin() {
    setLoading('line', true);
    clearError();

    try {
      const resp = await lineLoginAPI();
      console.log('LINE 授權 URL 取得成功:', resp.data);

      if (resp.data.authUrl) {
        window.location.href = resp.data.authUrl;
        return { success: true };
      } else {
        throw new Error('無法取得 LINE 授權連結');
      }

    } catch(err) {
      return { success: false, error: err.response?.data?.error || 'LINE 登入失敗' };
    } finally {
      setLoading('line', false);
    }
  }

  async function checkLineCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');
    const source = urlParams.get('source');

    if (success === 'true') {
      try {
        // 讀取後端設定的 user_info cookie
        const userInfoCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('user_info='))
          ?.split('=')
          .slice(1)
          .join('=');
        if (userInfoCookie) {
          const userData = JSON.parse(decodeURIComponent(userInfoCookie));

          // 更新前端狀態
          user.value = userData;
          // 同步到 localStorag 用於頁面重新整理時快速載入
          localStorage.setItem('user', JSON.stringify(userData));
          console.log('LINE 登入用戶資訊已同步:', userData);
        
          // 檢查用戶是否有偏好設定
          const hasPreferences = userData.hasPreferences;
          
          if (!hasPreferences) {
            // 新用戶或沒有偏好設定的用戶
            const result = await Swal.fire({
              title: 'LINE 登入成功！',
              html: `
                <p>歡迎 ${userData.lineDisplayName || userData.username || ''}！</p>
                <p style="color: #f39c12; margin-top: 10px;">
                  <i class="fa-solid fa-info-circle"></i> 
                  您尚未設定酒吧偏好，建議前往個人設定完成設定以獲得更好的推薦體驗
                </p>
              `,
              icon: 'success',
              confirmButtonText: '開始使用',
              showCancelButton: true,
              cancelButtonText: '立即設定',
              reverseButtons: true,
              customClass: {
                cancelButton: 'swal2-confirm',
                confirmButton: 'swal2-cancel'
              }
            });

            window.history.replaceState({}, document.title, window.location.pathname);

            if (result.dismiss === Swal.DismissReason.cancel) {
              // 用戶選擇立即設定，導向偏好設定頁面
              return { success: true, redirect: '/preferences?from=line-login' };
            } else {
              // 用戶選擇開始使用，導向主頁
              return { success: true, redirect: '/home' };
            }
          } else {
            // 已有偏好設定的用戶
            await Swal.fire({
              title: 'LINE 登入成功！',
              text: `歡迎回來 ${userData.lineDisplayName || userData.username || ''}！`,
              icon: 'success',
              confirmButtonText: '開始使用',
              timer: 2000,
              timerProgressBar: true
            });
          }
        }  

        window.history.replaceState({}, document.title, window.location.pathname);
        return { success: true, redirect: '/home' };
      } catch (err) {
        console.error('LINE 登入狀態同步失敗:', err);
        // 即使同步失敗 也顯示成功訊息
        await Swal.fire({
          title: 'LINE 登入成功!',
          text: '歡迎使用 LINE 登入',
          icon: 'success',
          confirmButtonText: '開始使用',
        });

        window.history.replaceState({}, document.title, window.location.pathname);
        return { success: true, redirect: '/home' };
      }

    } else if(error) {
      const errorMsg = decodeURIComponent(error);
      errorMessage.value = errorMsg;

      await Swal.fire({
        title: 'LINE 登入失敗',
        text: errorMsg,
        icon: 'error',
        confirmButtonText: '確認'
      });

      window.history.replaceState({}, document.title, window.location.pathname);
      return { success: false };
    }
    return null;
  }

  async function lineLogout() {
    clearError();
    try {
      console.log('開始 LINE 登出流程');

      try {
        await lineLogoutAPI();
        console.log('後端登出成功');
      } catch (err) {
        console.warn('後端登出失敗，但仍會清除本地狀態:', err);
      }

      clearAuthState();
      console.log('LINE 登出完成');

      return { success: true };
    } catch (err) {
      console.error('LINE 登出過程發生錯誤:', err);
      // 即使出錯也要清除本地狀態
      clearAuthState();
      return { 
        success: true,
        warning: '登出時發生錯誤，但本地狀態已清除' 
      };
    }
  }

  async function logout() {
    if (loginMethod.value === 'line') {
      return await lineLogout();
    } else {
      clearAuthState();
      return { success: true };
    }
  }

  // 取得帳戶註銷警告資訊
  async function getAccountDeletionWarning() {
    clearError();
    try {
      const response = await getAccountDeletionWarningAPI();
      return { success: true, data: response.data.data };
    } catch (err) {
      console.error('取得註銷警告資訊失敗:', err);
      const error = err.response?.data?.error || '載入失敗，請稍後再試';
      errorMessage.value = error;
      return { success: false, error };
    }
  }

  // 執行帳戶註銷
  async function deleteAccount(deleteData) {
    clearError();

    try {
      const response = await deleteAccountAPI(deleteData);
      clearAuthState();

      return { 
        success: true, 
        data: response.data.data,
        message: response.data.message 
      };
    } catch (err) {
      console.error('帳戶註銷失敗:', err);

      const errorResponse = err.response?.data;
      errorMessage.value = errorResponse?.error || '註銷失敗，請稍後再試';
      return { 
        success: false, 
        error: errorResponse?.error || '註銷失敗，請稍後再試',
        details: errorResponse?.details 
      };
    }
  }

  async function saveBarTags(preferences) {
    clearError();
    
    try {
      // 檢查用戶是否存在
      if (!user.value?.id) {
        throw new Error('用戶資訊不存在');
      }

      const resp = await saveBarTagsAPI(user.value.id, preferences);
      
      return { success: true, data: resp.data };
      
    } catch(err) {
      console.error('儲存偏好設定失敗:', err);

      return { success: false, error: err.response?.data?.message || '儲存失敗，請稍後再試' };
    }
  }

  async function getBarTags() {
  clearError();
  
  try {
    // 檢查用戶是否存在
    if (!user.value?.id) {
      throw new Error('用戶資訊不存在');
    }

    const resp = await getBarTagsAPI(user.value.id);
    
    return { success: true, data: resp.data };
    
  } catch(err) {
    console.error('取得偏好設定失敗:', err);

    return { success: false, error: err.response?.data?.error || '取得失敗，請稍後再試' };
  }
}  

  async function updateBarTags(preferences) {
  clearError();
  
  try {
    // 檢查用戶是否存在
    if (!user.value?.id) {
      throw new Error('用戶資訊不存在');
    }

    const resp = await updateBarTagsAPI(user.value.id, preferences);
    
    return { success: true, data: resp.data };
    
  } catch(err) {
    console.error('更新偏好設定失敗:', err);

    return { success: false, error: err.response?.data?.error || '更新失敗，請稍後再試' };
  }
}

  // 區分登入方式
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
    isAnyLoading,

    // 計算屬性
    isAuthenticated,
    currentUser,
    loginMethod,

    // 方法
    init,
    clearError,
    emailSignup,
    emailLogin,
    lineLogin,
    checkLineCallback,
    setLoading,
    clearAuthState,
    updateAuthUser,
    checkAuthStatus,
    handleResendVerification,
    saveBarTags,
    getBarTags,
    updateBarTags,
    lineLogout,
    logout,
    verifyEmail,
    getAccountDeletionWarning,
    deleteAccount
  };
});