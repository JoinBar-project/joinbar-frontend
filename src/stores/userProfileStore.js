import { defineStore } from 'pinia';
import { ref } from 'vue';
// import { getUserProfileById } from '@/api/user.js';

export const useUserProfileStore = defineStore('userProfile', () => {
  const profile = ref({
    username: '',
    nickname: '',
    birthday: '',
    avatarUrl: '' 
  });

  const isLoading = ref(false);
  const getUserProfile  = async (id) => {
    isLoading.value = true;

    try {
      const fakeUserData = { // 先模擬取得使用者資料
        123: {
          username: '測試',
          nickname: 'test',
          birthday: '2025-01-01',
          avatarUrl: '',
        },
      };

      const userData = fakeUserData[id];
      profile.value = userData;

      console.log('取得使用者資料成功:', userData);
    } catch (err) {
      console.error('取得使用者資料失敗', err);
    } finally {
      isLoading.value = false;
    }
  };

  return {
    profile,
    getUserProfile ,
    isLoading,
  };
});



// export const useUserProfileStore = defineStore('userProfile', () => {
//   const profile = ref({
//     username: '',
//     nickname: '',
//     birthday: '',
//     avatarUrl: '',
//   });

//   const isLoading = ref(false);

//   const getUserProfile = async (id) => {
//     isLoading.value = true;

//     try {
//       const data = await getUserProfileById(id);
//       profile.value = data;
//     } catch (err) {
//       console.error('取得使用者資料失敗', err);
//     } finally {
//       isLoading.value = false;
//     }
//   };

//   return { profile, getUserProfile, isLoading };
// });
