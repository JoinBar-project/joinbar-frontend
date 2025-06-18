import apiClient from '@/api/axios';

const getUserProfileById = async (id) => {
  try {
    const resp = await apiClient.get(`/users/${id}`);
    return resp.data;
  } catch (err) {
    console.error("取得使用者資料失敗",err);
    throw err;
  }
};

const patchUserProfileById = async (id, userData) => {
  try {
    const resp = await apiClient.patch(`/users/${id}`, userData);
    return resp.data;
  } catch (err) {
    console.error('更新使用者資料失敗', err);
    throw err;
  }
};

export { getUserProfileById, patchUserProfileById };
