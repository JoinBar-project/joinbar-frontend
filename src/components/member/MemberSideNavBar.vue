<script setup>
import { ref, computed } from 'vue';
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

const userId = computed(() => user.value?.id);

const profileLink = computed(() => ({ name: 'MemberProfile', params: { id: userId.value } }));
const eventLink = computed(() => ({ name: 'MemberEventRecords', params: { id: userId.value } }));
const barLink = computed(() => ({ name: 'MemberBarFavorites', params: { id: userId.value } }));
const memberCardLink = computed(() => ({ name: 'MemberCard', params: { id: userId.value } }));
const ordersLink = computed(() => ({ name: 'MemberOrderRecords', params: { id: userId.value } }));

const menuItems = [
  { name: 'profile', label: '會員資料', icon: 'fa-user', to: profileLink },
  { name: 'event', label: '揪團活動紀錄', icon: 'fa-calendar', to: eventLink },
  { name: 'bar', label: '我的酒吧收藏', icon: 'fa-beer-mug-empty', to: barLink },
  { name: 'card', label: '酒友卡', icon: 'fa-id-card', to: memberCardLink },
  { name: 'orders', label: '訂單紀錄', icon: 'fa-receipt', to: ordersLink },
];

const selectedItem = ref('profile');
</script>

<template>
  <nav class="w-56 bg-gray-100 p-6 min-h-screen flex justify-center">
    <ul class="space-y-1 w-full">
      <li v-for="item in menuItems" :key="item.name">
        <RouterLink
          :to="item.to"
          @click="selectedItem = item.name"
          :class="['flex items-center gap-2 p-2 rounded w-full transition',selectedItem === item.name
            ? 'bg-gray-200 text-black scale-[0.98]'
            : 'hover:bg-gray-200 text-gray-700']">
          <i :class="['fa-solid', item.icon, 'w-4']" />
          {{ item.label }}
        </RouterLink>
      </li>

      <!-- 登出 -->
      <li>
        <button @click="handleLogout" class="flex items-center gap-2 p-2 rounded w-full text-black hover:bg-gray-200 transition cursor-pointer">
          <i class="fa-solid fa-arrow-right-from-bracket w-4" />登出</button>
      </li>
    </ul>
  </nav>
</template>
