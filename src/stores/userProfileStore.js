import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getUserProfileById } from '@/api/userProfile.js';

export const useUserProfileStore = defineStore('userProfile', () => {
  const profile = ref({
    username: '',
    nickname: '',
    birthday: '',
    avatarUrl: '',
  });

  const isLoading = ref(false);
  const getUserProfile = async id => {
    isLoading.value = true;

    try {
      const { data } = await getUserProfileById(id);
      profile.value = data;
      console.log('取得使用者資料成功:', data);
    } catch (err) {
      console.error('取得使用者資料失敗', err);
    } finally {
      isLoading.value = false;
    }
  };

  return {
    profile,
    getUserProfile,
    isLoading,
  };
});
