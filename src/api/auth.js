import apiClient from './axios';

// 驗證當前認證狀態
export const verifyAuth = () =>
  apiClient.get('/auth/verify');

// 重新寄送驗證信
export const resendVerification = (email) =>
  apiClient.post('/auth/resend-verification', { email });

// 電子郵件登入
export const login = (email, password) =>
  apiClient.post('/auth/login', { email, password });

// 取得 LINE 登入授權 URL
export const getLineAuthUrl = () =>
  apiClient.get('/auth/line/url');

export const register = (userData) =>
  apiClient.post('/auth/signup', userData);