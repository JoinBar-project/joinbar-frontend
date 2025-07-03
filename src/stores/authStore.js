import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useAlertModal } from '@/composables/useAlertModal';
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

  const { showAlert, showConfirm } = useAlertModal();

  const currentUser = computed(() => user.value);
  const isAnyLoading = computed(() => isLoading.value || isEmailLoading.value || isLineLoading.value);
  const isAuthenticated = computed(() => {
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

  async function checkAuthStatus() {
    if (!user.value) {
      return false;
    }

    try {
      await verifyAuth();
      console.log('認證狀態有效');
      return true;
    } catch (error) {
      console.warn('認證狀態無效');
      return false;
    }
  }

  async function handleResendVerification(email) {
    try {
      showAlert('info', '寄送中...', '正在重新寄送驗證信，請稍候');

      await resendVerification(email);

      showAlert(
        'success',
        '驗證信已重新寄送！',
        `新的驗證信已寄送至：${email}\n\n請檢查您的信箱（包含垃圾信件夾），點擊驗證連結完成驗證。`,
        '我知道了'
      );

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
        
        showAlert('success', errorTitle, errorMessage);
        return false;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }

      showAlert('error', errorTitle, errorMessage);
      return false;
    }
  }

  async function verifyEmail(token) {
    if (!token) {
      return { success: false, error: '缺少驗證 token', type: 'validation' };
    }

    try {
      await verifyEmailAPI(token);

      showAlert(
        'success',
        '驗證成功！',
        '您的信箱已成功驗證，現在您可以正常登入並使用所有功能了',
        '前往登入'
      );

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
          
          showAlert('info', errorTitle, '您的信箱已經驗證完成，可以直接登入', '前往登入');
          return { success: true, message: '信箱已經驗證完成', type: 'already_verified', handled: true };
        } else if (errorMessage.includes('無效')) {
          errorTitle = '無效的驗證連結';
          errorType = 'invalid';
        } else if (errorMessage.includes('缺少')) {
          errorType = 'validation';
        }
      }

      showAlert('error', errorTitle, errorMessage);
      return { success: false, error: errorMessage, type: errorType, handled: true };
    }
  }

  function init() {
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

        if (!user.value || user.value.id !== userData.id) {
          user.value = userData;
          localStorage.setItem('user', JSON.stringify(userData));
          console.log('從 cookie 更新用戶資訊 (LINE 登入):', userData);
        }
      } else if (user.value && !storedAccessToken) {
        console.log('檢查 LINE 登入狀態...');
      }
    } catch (err) {
      console.error('從 cookie 讀取用戶資訊失敗:', err);
    }

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

      showAlert(
        'success',
        '註冊成功！',
        `帳號建立成功！驗證信已寄送至：${userData.email}\n\n請檢查您的信箱（包含垃圾信件夾），點擊驗證連結完成驗證。`,
        '我知道了'
      );

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
      if (err.response?.status === 403 && err.response?.data?.needVerification) {
        const isExpired = err.response.data.tokenExpired;

        return new Promise((resolve) => {
          showConfirm(
            '信箱尚未驗證',
            `無法登入，因為您的信箱尚未完成驗證。${isExpired ? '\n您的驗證連結已過期。' : ''}\n\n是否要重新寄送驗證信？`,
            '重新寄送驗證信',
            '稍後再試',
            async () => {
              // 確認重新寄送
              await handleResendVerification(email);
              resolve({ success: false, needVerification: true, handled: true });
            },
            () => {
              // 取消
              resolve({ success: false, needVerification: true, handled: true });
            },
            'warning'
          );
        });
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

    if (success === 'true') {
      try {
        const userInfoCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('user_info='))
          ?.split('=')
          .slice(1)
          .join('=');

        if (userInfoCookie) {
          const userData = JSON.parse(decodeURIComponent(userInfoCookie));

          user.value = userData;
          localStorage.setItem('user', JSON.stringify(userData));
          console.log('LINE 登入用戶資訊已同步:', userData);
        
          const hasPreferences = userData.hasPreferences;
          
          if (!hasPreferences) {
            return new Promise((resolve) => {
              showConfirm(
                'LINE 登入成功！',
                `歡迎 ${userData.lineDisplayName || userData.username || ''}！\n\n您尚未設定酒吧偏好，是否要立即設定以獲得更好的推薦體驗？`,
                '立即設定',
                '稍後設定',
                () => {
                  window.history.replaceState({}, document.title, window.location.pathname);
                  resolve({ success: true, redirect: '/preferences?from=line-login' });
                },
                () => {
                  window.history.replaceState({}, document.title, window.location.pathname);
                  resolve({ success: true, redirect: '/home' });
                },
                'question'
              );
            });
          } else {
            showAlert(
              'success',
              'LINE 登入成功！',
              `歡迎回來 ${userData.lineDisplayName || userData.username || ''}！`
            );
          }
        }  

        window.history.replaceState({}, document.title, window.location.pathname);
        return { success: true, redirect: '/home' };
      } catch (err) {
        console.error('LINE 登入狀態同步失敗:', err);
        
        showAlert('success', 'LINE 登入成功!', '歡迎使用 LINE 登入');
        window.history.replaceState({}, document.title, window.location.pathname);
        return { success: true, redirect: '/home' };
      }

    } else if(error) {
      const errorMsg = decodeURIComponent(error);
      errorMessage.value = errorMsg;

      showAlert('error', 'LINE 登入失敗', errorMsg);
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

  const loginMethod = computed(() => {
    if (!user.value) return null;
    if (accessToken.value) return 'email';
    return 'line';
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