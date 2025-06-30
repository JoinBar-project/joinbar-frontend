<script setup>
import { watch, computed, onMounted, ref } from 'vue';
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

// 偏好設定的響應式資料
const userPreferences = ref({
  types: [],
  moods: []
});

const isLoadingPreferences = ref(false);

const profileFields = [
  { model: 'username', label: '姓名*', placeholder: '請輸入姓名', icon: 'fa-solid fa-user', type: 'text' },
  { model: 'nickname', label: '暱稱', placeholder: '請輸入暱稱', icon: 'fa-solid fa-tag', type: 'text' },
  { model: 'birthday', label: '生日', placeholder: '請輸入生日', icon: 'fa-solid fa-cake-candles', type: 'date' },
];

// 載入偏好設定
const loadUserPreferences = async () => {
  if (!userId.value) return;
  
  isLoadingPreferences.value = true;
  console.log('開始載入偏好設定...');
  
  try {
    const result = await authStore.getBarTags();
    
    if (result.success) {
      console.log('成功載入偏好設定:', result.data);
      
      // 將後端的布林值格式轉換為前端的陣列格式
      const backendPrefs = result.data;
      const types = [];
      const moods = [];
      
      // 轉換類型偏好
      if (backendPrefs.sport) types.push('sport');
      if (backendPrefs.music) types.push('music');
      if (backendPrefs.student) types.push('student');
      if (backendPrefs.bistro) types.push('bistro');
      if (backendPrefs.drink) types.push('drink');
      
      // 轉換氛圍偏好
      if (backendPrefs.joy) moods.push('joy');
      if (backendPrefs.romantic) moods.push('romantic');
      if (backendPrefs.oldschool) moods.push('oldschool');
      if (backendPrefs.highlevel) moods.push('highlevel');
      if (backendPrefs.easy) moods.push('easy');
      
      userPreferences.value = { types, moods };
      
      console.log('轉換後的偏好設定:', userPreferences.value);
    } else {
      console.warn('載入偏好設定失敗:', result.error);
      userPreferences.value = { types: [], moods: [] };
    }
  } catch (error) {
    console.error('載入偏好設定時發生錯誤:', error);
    userPreferences.value = { types: [], moods: [] };
  } finally {
    isLoadingPreferences.value = false;
  }
};

// 監聽用戶ID變化，載入個人資料
watch(
  userId,
  id => {
    if (id) {
      userProfileStore.getUserProfile(id);
      loadUserPreferences(); // 同時載入偏好設定
    }
  },
  { immediate: true }
);

// 組件載入時執行
onMounted(() => {
  if (userId.value) {
    loadUserPreferences();
  }
});

// 跳轉到編輯頁面
const goToProfileEdit = () => {
  router.push({ 
    name: 'ProfileEdit', 
    params: { id: userId.value },
    query: { mode: 'profile' }
  });
};

const goToPreferencesEdit = () => {
  router.push({ 
    name: 'ProfileEdit', 
    params: { id: userId.value },
    query: { mode: 'preferences' }
  });
};
</script>

<template>
  <div v-if="isLoading || isLoadingPreferences" class="py-10 text-center">載入中...</div>
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
            :preferences="userPreferences"
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