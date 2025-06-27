import apiClient from './axios';

// 驗證當前認證狀態
export const verifyAuth = () => apiClient.get('/auth/verify');

// 重新寄送驗證信
export const resendVerification = (email) => apiClient.post('/auth/resend-verification', { email });

// 電子郵件登入
export const emaillogin = (email, password) => apiClient.post('/auth/login', { email, password });

// 取得 LINE 登入授權 URL
export const lineLogin = () => apiClient.get('/auth/line/url');

// LINE 登出
export const lineLogout = () => apiClient.post('/auth/line/logout');

// 電子郵件註冊
export const emailSignup = (userData) => apiClient.post('/auth/signup', userData);

// 信箱驗證
export const verifyEmail = (token) => apiClient.get(`/auth/verify-email?token=${token}`);

// 取得帳戶註銷警告
export const getAccountDeletionWarning = () => apiClient.get('/account/deletion-warning');

// 帳戶註銷
export const deleteAccount = (data) => apiClient.delete('/account/delete', { data });

// 儲存酒吧偏好設定
export const saveBarTags = (userId, preferencesData) => apiClient.post(`/barTags/user/${userId}`, preferencesData);

// 取得用戶酒吧偏好設定
export const getBarTags = (userId) => apiClient.get(`/barTags/user/${userId}`);