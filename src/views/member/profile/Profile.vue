<script setup>
import { useAuthStore } from '@/api/auth';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { storeToRefs } from 'pinia';
import { useRouter, useRoute } from 'vue-router';
import { watch } from 'vue';
import ProfileForm from '@/components/member/ProfileForm.vue';

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);

const userProfileStore = useUserProfileStore();
const { profile } = storeToRefs(userProfileStore);

const route = useRoute();
const router = useRouter();

watch(
  () => user.value?.id,
  id => {
    if (id) userProfileStore.getUserProfile(id);
  },
  { immediate: true }
);

const profileFields = [
  { model: 'username', placeholder: '姓名', icon: 'fa-solid fa-user', type: 'text' },
  { model: 'nickname', placeholder: '暱稱', icon: 'fa-solid fa-user-pen', type: 'text' },
  { model: 'birthday', placeholder: '生日', icon: 'fa-solid fa-cake-candles', type: 'date' },
];
const barTypes = ['運動酒吧', '音樂酒吧', '學生酒吧', '餐酒館', '暢飲店'];
const barMoods = ['熱鬧歡樂', '浪漫私密', '復古懷舊', '高級精緻', '輕鬆悠閒'];

const goToEdit = () => {
  router.push({ name: 'MemberProfileEdit', params: { id: user.value.id } });
};
</script>

<template>
  <ProfileForm :form="profile" :isEdit="false" :profileFields="profileFields" :barTypes="barTypes" :barMoods="barMoods" :toggleSelection="() => {}" />

  <button type="button" class="mt-6 px-4 py-2 bg-gray-800 text-white rounded flex justify-center" @click="goToEdit">編輯</button>
</template>
