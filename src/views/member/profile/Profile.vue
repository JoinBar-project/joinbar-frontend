<script setup>
import { watch, computed } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import ProfileForm from '@/components/member/ProfileForm.vue';
import UserAvatar from '@/components/UserAvatar.vue';

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);

const userProfileStore = useUserProfileStore();
const { profile, isLoading } = storeToRefs(userProfileStore);

const router = useRouter();

const userId = computed(() => user.value?.id);

watch(
  userId,
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
  router.push({ name: 'MemberProfileEdit', params: { id: userId.value } });
};
</script>

<template>
  <div
    v-if="isLoading"
    class="text-center py-10">
    載入中...
  </div>
  <div
    v-else
    class="max-w-md mx-auto mt-10 flex flex-col items-center">
    <UserAvatar
      :avatar-url="profile.avatarUrl || '/default-user-avatar.png'"
      :display-name="profile.username"
      :show-name="false" />
    <ProfileForm
      :form="profile"
      :isEdit="false"
      :profileFields="profileFields"
      :barTypes="barTypes"
      :barMoods="barMoods"
      :toggleSelection="() => {}" />

    <button
      type="button"
      class="mt-6 px-4 py-2 bg-gray-800 text-white rounded cursor-pointer"
      @click="goToEdit">
      編輯
    </button>
  </div>
</template>
