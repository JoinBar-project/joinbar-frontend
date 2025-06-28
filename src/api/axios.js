import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  },
});

// 解析 JSON
const jsonParse = (jsonStr, defaultValue = {}) => {
  try {
    return jsonStr ? JSON.parse(jsonStr) : defaultValue;
  } catch (error) {
    console.warn('JSON 解析失敗:', error);
    return defaultValue;
  }
};

// 檢查token是否過期
const isTokenExpired = (token) => {
  if (!token) return true;

  try {
    // atob解析base64編碼字串
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch (error) {
    console.warn('Token 解析失敗:', error);
    return true;
  }
};

// 請求攔截器
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API 請求: ${config.method.toUpperCase()} ${config.url}`);

    // 檢查是否需要添加 Authorization header (Email 登入)
    const token = localStorage.getItem('access_token');
    const user = jsonParse(localStorage.getItem('user'));

    // 如果有 token 且不是 LINE 用戶，則添加 Authorization header
    if (token && !isTokenExpired(token) && user?.providerType !== 'line') {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('添加 Bearer token 到請求 headers');
    } else if (user?.providerType === 'line') {
      console.log('LINE 用戶，使用 cookie 認證');
    } else if (token && isTokenExpired(token)) {
      console.warn('Token 已過期，需要重新登入');
    }

    return config;
  },
  (error) => {
    console.error('請求攔截器錯誤:', error);
    return Promise.reject(error);
  }
);

// 響應攔截器
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API 回應: ${response.config.method.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  async (error) => {
    const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
    const url = error.config?.url || 'unknown-url';
    const status = error.response?.status || 'no-status';

    console.error(`API 錯誤: ${method} ${url} - ${status}`);

    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401: {
          // Token 無效或過期
          const originalRequest = error.config; // 先保留剛剛發送失敗的請求，等等用新的 access token 重新發送
          // 先檢查是否為刷新 token 的請求本身
          if (originalRequest.url === '/auth/refresh-token') {
            console.log('refresh-token 請求失敗');

            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');

            alert('請重新登入');

            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
            return Promise.reject(error);
          }

          if (originalRequest._retry) {
            // 如果之前已經有重新發送請求，就不再重試，直接拋錯，避免進入無限重試迴圈
            return Promise.reject(error);
          }

          originalRequest._retry = true; // 標記這是第一次重新發送請求

          try {
            const user = jsonParse(localStorage.getItem('user'));
            const isLineUser = user?.providerType === 'line';

            const refreshToken = localStorage.getItem('refresh_token');
            const resp = isLineUser
              ? // 這邊改使用 axios 直接發送請求，避免當 refresh token 無效時，該請求也會收到 401 錯誤，觸發攔截器又嘗試刷新
                await axios.post(
                  `${API_BASE_URL}/auth/refresh-token`, {}, {
                    withCredentials: true,
                    headers: { 'Content-Type': 'application/json' }
                  })
              : await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
                    refreshToken // 用 resfresh token 換新的 access token
                  }, {
                    headers: { 'Content-Type': 'application/json' }
                  });

            const newAccessToken = resp.data.accessToken;

            if (!isLineUser) {
              localStorage.setItem('access_token', newAccessToken);
            }

            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

            return apiClient(originalRequest); // 重新發送原本失敗的請求
          } catch (refreshError) {
            console.error('token 刷新失敗', refreshError);
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');

            alert('請重新登入');

            try {
              // 動態導入 store 和 router 避免循環依賴
              const { useAuthStore } = await import('@/stores/authStore');
              const { useRouter } = await import('vue-router');
              const authStore = useAuthStore();
              const router = useRouter();
              // 清除前端狀態
              authStore.clearAuthState();
              if (router.currentRoute.value.path !== '/login') {
                router.push('/login');
              }
            } catch (importError) {
              console.error('動態導入失敗:', importError);
              if (window.location.pathname !== '/login') {
                window.location.href = '/login';
              }
            }
          }
          break;
        }
        case 403:
          console.warn('權限不足:', data?.message || '無權限存取此資源');
          break;
        case 404:
          console.warn('資源不存在:', data?.message || '請求的資源未找到');
          break;
        case 500:
          console.error('伺服器內部錯誤:', data?.message || '伺服器發生錯誤');
          break;
        default:
          console.error(`未處理的錯誤狀態: ${status}`, data?.message || '未知錯誤');
      }
    } else if (error.request) {
      console.error('網路連線錯誤');
    }
    return Promise.reject(error);
  }
);

export default apiClient;