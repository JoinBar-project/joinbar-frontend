<script setup>
import { watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/stores/authStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import ProfileForm from '@/components/member/ProfileForm.vue';
import PreferencesForm from '@/components/member/PreferencesForm.vue';
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

watch(
  userId,
  id => {
    if (id) userProfileStore.getUserProfile(id);
  },
  { immediate: true }
);



const goToEdit = () => {
  router.push({ name: 'ProfileEdit', params: { id: userId.value } });
};
</script>

<template>
  <div v-if="isLoading" class="py-10 text-center">載入中...</div>
  <div v-else class="w-full max-w-4xl px-4 mx-auto mt-10">
    <div class="flex flex-col items-center gap-10 md:flex-row md:items-start">
      <!-- 左側：會員頭像 -->
      <div class="flex justify-center md:block md:w-1/3">
        <UserAvatar 
        :avatar-url="profile.avatarUrl || '/default-user-avatar.png'" 
        :display-name="profile.username" 
        :show-name="false" 
        size="lg" />
      </div>

      <!-- 右側：個人資料 + 酒吧偏好 + 修改按鈕 -->
      <div class="flex flex-col items-center w-full space-y-6 md:w-2/3 md:items-start">
        <!-- 個人資料部分 -->
        <ProfileForm
          :form="profile"
          :isEdit="false"
          :profileFields="profileFields"
          :errors="{ username: '', nickname: '', birthday: '' }" />
        
        <!-- 偏好設定部分 -->
        <PreferencesForm 
          :preferences="profile.preferences"
          :isEdit="false"
          :showTitle="true"
          :showSaveButton="false"
        />
        
        <div class="text-center md:text-left">
          <button type="button" 
          class="px-4 py-2 bg-[var(--color-black)] text-white rounded cursor-pointer active:scale-98 transition-all duration-150"
          @click="goToEdit">修改個人資料 <i class="fa-solid fa-pen"></i></button>
        </div>
      </div>
    </div>
  </div>
</template>