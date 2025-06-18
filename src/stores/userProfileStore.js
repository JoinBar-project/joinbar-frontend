import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getUserProfileById, patchUserProfileById } from '@/api/userProfile.js';

export const useUserProfileStore = defineStore('userProfile', () => {
  const profile = ref({
    username: '',
    nickname: '',
    birthday: '',
    avatarUrl: '',
  });

  const isLoading = ref(false);
  
  const getUserProfile = async (id) => {
    isLoading.value = true;

    try {
      const { data } = await getUserProfileById(id);
      profile.value = data;
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
      profile.value = data;
      console.log('更新使用者資料成功:', data);
      return data;
    } catch (err) {
      console.error('更新使用者資料失敗', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    profile,
    getUserProfile,
    updateUserProfile,
    isLoading,
  };
});
