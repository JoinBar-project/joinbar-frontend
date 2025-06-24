<script setup>
import { computed } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { storeToRefs } from 'pinia';
import Swal from 'sweetalert2';

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);
const router = useRouter();

const handleLogout = async () => {
  if(authStore.loginMethod === 'line' ) {
    try {
      const result = await authStore.lineLogout();

      if (result.success) {
        await Swal.fire({
          title: '登出成功！',
          text: '您已安全登出，感謝使用',
          icon: 'success',
          confirmButtonText: '確認',
          timer: 1500,
          timerProgressBar: true
        });
        router.push('/login');
      }
    } catch (error) {
      console.error('登出失敗:', error);
      await Swal.fire({
        title: '登出失敗',
        text: '請稍後再試',
        icon: 'error',
        confirmButtonText: '確認'
      });
    }
  } else {
    try {
      const result = await authStore.logout();

      if (result.success) {
        await Swal.fire({
          title: '登出成功！',
          text: '您已安全登出，感謝使用',
          icon: 'success',
          confirmButtonText: '確認',
          timer: 1500,
          timerProgressBar: true
        });
        router.push('/login');
      }
    } catch (error) {
      console.error('登出失敗:', error);
      await Swal.fire({
        title: '登出失敗',
        text: '請稍後再試',
        icon: 'error',
        confirmButtonText: '確認'
      });
    }
  }
};

const handleAccountDeletion = async () => {
  try {} catch(err) {
    console.error('註銷過程發生錯誤:', err);
    
    let errorTitle = '註銷失敗';
    let errorMessage = '處理過程發生錯誤，請稍後再試';

    if(err.response?.data) {
      const errorData = err.response.data;
      console.log('錯誤詳情:', errorData);

      if(errorData.details) {
        const validationErrors = errorData.details.map(detail => detail.message).join('、');
        errorMessage = `驗證失敗：${validationErrors}`;
      } else if (errorData.error) {
        errorMessage = errorData.error;

        if(errorMessage.includes('密碼錯誤')) {
          errorTitle = '密碼驗證失敗';
        } else if(errorMessage.includes('確認文字')) {
          errorTitle = '確認文字錯誤';
        } else if(errorMessage.includes('找不到用戶')) {
          errorTitle = '帳戶驗證失敗';
        }
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    await Swal.fire({
      title: errorTitle,
      text: errorMessage,
      icon: 'error',
      confirmButtonText: '確認',
      confirmButtonColor: '#dc2626'
    });
  }
}

const userId = computed(() => user.value?.id);

const profileLink = computed(() => ({ name: 'MemberProfile', params: { id: userId.value } }));
const eventLink = computed(() => ({ name: 'MemberEventRecords', params: { id: userId.value } }));
const barLink = computed(() => ({ name: 'MemberBarFavorites', params: { id: userId.value } }));
const memberCardLink = computed(() => ({ name: 'MemberCard', params: { id: userId.value } }));
const ordersLink = computed(() => ({ name: 'MemberOrderRecords', params: { id: userId.value } }));
</script>

<template>
  <nav class="flex justify-center w-64 min-h-screen p-6 bg-gray-100">
    <ul class="space-y-1">
      <li><RouterLink :to="profileLink">會員資料</RouterLink></li>
      <li><RouterLink :to="eventLink">揪團活動紀錄</RouterLink></li>
      <li><RouterLink :to="barLink">我的酒吧收藏</RouterLink></li>
      <li><RouterLink :to="memberCardLink">酒友卡</RouterLink></li>
      <li><RouterLink :to="ordersLink">訂單紀錄</RouterLink></li>
      <li><button @click="handleAccountDeletion"  class="cursor-pointer">會員註銷</button></li>
      <li><button @click="handleLogout" class="cursor-pointer">登出</button></li>
    </ul>
  </nav>
</template>