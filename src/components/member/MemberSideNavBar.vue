<script setup>
import { computed } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { storeToRefs } from 'pinia';

const authStore = useAuthStore();
const { clearAuthState } = authStore;
const { user } = storeToRefs(authStore);
const router = useRouter();

const handleLogout = () => {
  clearAuthState();
  router.push('/login');
};

const userId = computed(() => user.value?.id);

const profileLink = computed(() => ({ name: 'MemberProfile', params: { id: userId.value } }));
const eventLink = computed(() => ({ name: 'MemberEventRecords', params: { id: userId.value } }));
const barLink = computed(() => ({ name: 'MemberBarFavorites', params: { id: userId.value } }));
const ordersLink = computed(() => ({ name: 'MemberOrderRecords', params: { id: userId.value } }));
</script>

<template>
  <nav class="w-64 bg-gray-100 p-6 min-h-screen flex justify-center">
    <ul class="space-y-1">
      <li><RouterLink :to="profileLink">會員資料</RouterLink></li>
      <li><RouterLink :to="eventLink">揪團活動紀錄</RouterLink></li>
      <li><RouterLink :to="barLink">我的酒吧收藏</RouterLink></li>
      <li><RouterLink :to="ordersLink">訂單紀錄</RouterLink></li>
      <li><button @click="handleLogout" class="cursor-pointer">登出</button></li>
    </ul>
  </nav>
</template>