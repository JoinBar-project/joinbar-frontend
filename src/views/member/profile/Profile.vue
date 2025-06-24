<script setup>
import { watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/stores/authStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import ProfileForm from '@/components/member/ProfileForm.vue';
import UserAvatar from '@/components/UserAvatar.vue';

const authStore = useAuthStore();
const userProfileStore = useUserProfileStore();
const router = useRouter();

const { user } = storeToRefs(authStore);
const { profile, isLoading } = storeToRefs(userProfileStore);

const userId = computed(() => user.value?.id);

const profileFields = [
  { model: 'username', label: '姓名*', placeholder: '請輸入姓名', icon: 'fa-solid fa-user', type: 'text' },
  { model: 'nickname', label: '暱稱', placeholder: '請輸入暱稱', icon: 'fa-solid fa-tag', type: 'text' },
  { model: 'birthday', label: '生日', placeholder: '請輸入生日', icon: 'fa-solid fa-cake-candles', type: 'date' },
];
const barTypes = ['運動酒吧', '音樂酒吧', '學生酒吧', '餐酒館', '暢飲店'];
const barMoods = ['熱鬧歡樂', '浪漫私密', '復古懷舊', '高級精緻', '輕鬆悠閒'];

watch(
  userId,
  id => {
    if (id) userProfileStore.getUserProfile(id);
  },
  { immediate: true }
);



const goToEdit = () => {
  router.push({ name: 'MemberProfileEdit', params: { id: userId.value } });
};
</script>

<template>
  <div v-if="isLoading" class="text-center py-10">載入中...</div>
  <div v-else class="w-full max-w-4xl mx-auto mt-10 px-4">
    <div class="flex flex-col md:flex-row items-center md:items-start gap-10">
      <!-- 左側：會員頭像 -->
      <div class="flex justify-center md:block md:w-1/3">
        <UserAvatar 
        :avatar-url="profile.avatarUrl || '/default-user-avatar.png'" 
        :display-name="profile.username" 
        :show-name="false" 
        size="lg" />
      </div>

      <!-- 右側：個人資料 + 酒吧偏好 + 編輯按鈕 -->
      <div class="w-full md:w-2/3 space-y-6 flex flex-col items-center md:items-start">
        <ProfileForm
          :form="profile"
          :isEdit="false"
          :profileFields="profileFields"
          :barTypes="barTypes"
          :barMoods="barMoods"
          :toggleSelection="() => {}"
          :errors="{ username: '', nickname: '', birthday: '' }" />
        <div class="text-center md:text-left">
          <button type="button" 
          class="px-4 py-2 bg-gray-800 text-white rounded cursor-pointer active:scale-98 transition-all duration-150"
          @click="goToEdit">編輯個人資料</button>
        </div>
      </div>
    </div>
  </div>
</template>
