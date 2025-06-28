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

// 跳轉到編輯頁面
const goToProfileEdit = () => {
  router.push({ 
    name: 'ProfileEdit', 
    params: { id: userId.value },
    query: { mode: 'profile' }  // 編輯個人資料
  });
};

const goToPreferencesEdit = () => {
  router.push({ 
    name: 'ProfileEdit', 
    params: { id: userId.value },
    query: { mode: 'preferences' }  // 編輯偏好設定
  });
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

      <!-- 右側：個人資料 + 酒吧偏好 -->
      <div class="flex flex-col items-center w-full space-y-6 md:w-2/3 md:items-start">
        
        <!-- 個人資料區塊 -->
        <div class="w-full">
          <ProfileForm
            :form="profile"
            :isEdit="false"
            :profileFields="profileFields"
            :errors="{ username: '', nickname: '', birthday: '' }" />
          
          <!-- 個人資料編輯按鈕 -->
          <div class="flex justify-center w-full mt-4">
            <button 
              type="button" 
              class="px-4 py-2 text-white transition-all duration-150 bg-blue-500 rounded cursor-pointer active:scale-98 hover:bg-blue-600"
              @click="goToProfileEdit">
              <i class="mr-2 fa-solid fa-user"></i>
              修改個人資料
            </button>
          </div>
        </div>
        
        <!-- 偏好設定區塊 -->
        <div class="w-full">
          <PreferencesForm 
            :preferences="profile.preferences"
            :isEdit="false"
            :showTitle="true"
          />
          
          <!-- 偏好設定編輯按鈕 -->
          <div class="flex justify-center w-full mt-4">
            <button 
              type="button" 
              class="px-4 py-2 bg-[var(--color-primary-orange)] text-white rounded cursor-pointer active:scale-98 transition-all duration-150 hover:brightness-110"
              @click="goToPreferencesEdit">
              <i class="mr-2 fa-solid fa-heart"></i>
              修改偏好設定
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>