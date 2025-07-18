import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getUserProfileById, patchUserProfileById, patchUserAvatar, deleteUserAvatar } from '@/api/userProfile.js';

export const useUserProfileStore = defineStore('userProfile', () => {
  const profile = ref({
    username: '',
    nickname: '',
    birthday: '',
    avatarUrl: '',
    preferences: {
      types: [],
      moods: [],
    },
  });

  const isLoading = ref(false);

  const getUserProfile = async id => {
    isLoading.value = true;

    try {
      const { data } = await getUserProfileById(id);
      profile.value = {
        username: data.username || '',
        nickname: data.nickname || '',
        birthday: data.birthday || '',
        avatarUrl: data.avatarUrl || '',
        preferences: data.preferences || { types: [], moods: [] },
      };
      console.log('取得使用者資料成功:', data);
    } catch (err) {
      console.error('取得使用者資料失敗', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const updateUserProfile = async (id, userData) => {
    isLoading.value = true;

    try {
      const { data } = await patchUserProfileById(id, userData);
      profile.value = {
        username: data.username || '',
        nickname: data.nickname || '',
        birthday: data.birthday || '',
        avatarUrl: data.avatarUrl || '',
        preferences: data.preferences || { types: [], moods: [] },
      };
      console.log('更新使用者資料成功:', data);
      return data;
    } catch (err) {
      console.error('更新使用者資料失敗', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const updateUserAvatar = async (id, file) => {
    isLoading.value = true;
    try {
      const { data } = await patchUserAvatar(id, file);
      profile.value.avatarUrl = data.avatarUrl;
      console.log('會員頭像更新成功', data);
      return data.avatarUrl;
    } catch (err) {
      console.error('會員頭像更新失敗', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const removeUserAvatar = async id => {
    isLoading.value = true;
    try {
      const { data } = await deleteUserAvatar(id);
      profile.value.avatarUrl = '';
      console.log('會員頭像刪除成功', data);
    } catch (err) {
      console.error('會員頭像刪除失敗', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    profile,
    getUserProfile,
    updateUserProfile,
    updateUserAvatar,
    removeUserAvatar,
    isLoading,
  };
});
