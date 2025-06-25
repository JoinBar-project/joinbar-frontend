import apiClient from '@/api/axios';

const getUserProfileById = async (id) => {
  const { data } = await apiClient.get(`/users/${id}`);
  return data;
};

const patchUserProfileById = async (id, userData) => {
  const { data } = await apiClient.patch(`/users/${id}`, userData);
  return data;
};

const patchUserAvatar = async (id, file) => {
  const formData = new FormData();
  formData.append('userAvatar', file);

  const { data } = await apiClient.patch(`/users/${id}/avatar`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
  });

  return data;
};

const deleteUserAvatar = async (id) => {
  const { data } = await apiClient.delete(`/users/${id}/avatar`);
  return data;
};

export { getUserProfileById, patchUserProfileById, patchUserAvatar, deleteUserAvatar };