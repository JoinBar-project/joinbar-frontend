<script setup>
import { ref, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/stores/authStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useSuccessAlert } from '@/composables/useSuccessAlert';
import ProfileForm from '@/components/member/ProfileForm.vue';
import PreferencesForm from '@/components/member/PreferencesForm.vue';
import UserAvatar from '@/components/UserAvatar.vue';
import { validateUserProfile } from '@/utils/validators.js';

const authStore = useAuthStore();
const userProfileStore = useUserProfileStore();
const router = useRouter();
const { showAlert, triggerAlert } = useSuccessAlert();

const { user } = storeToRefs(authStore);
const { profile, isLoading } = storeToRefs(userProfileStore);
const { updateUserAvatar, removeUserAvatar } = userProfileStore;

const form = ref({
  username: '',
  nickname: '',
  birthday: '',
  preferences: {
    types: [],
    moods: [],
  },
});

const userId = computed(() => user.value?.id);
const avatarFile = ref(null);
const avatarPreview = ref('');
const defaultAvatar = '/default-user-avatar.png';
const isAvatarRemoved = ref(false);

// 分別的載入狀態
const isProfileSaving = ref(false);
const isPreferencesSaving = ref(false);

const isDefaultAvatar = computed(() => {
  const currentUrl = avatarPreview.value || profile.value.avatarUrl;

  if (!currentUrl || currentUrl.includes(defaultAvatar)) {
    return true;
  }
  return false;
});

const errors = ref({
  username: '',
  nickname: '',
  birthday: '',
});

const profileFields = [
  { model: 'username', label: '姓名', placeholder: '請輸入姓名', icon: 'fa-solid fa-user', type: 'text' },
  { model: 'nickname', label: '暱稱', placeholder: '請輸入暱稱', icon: 'fa-solid fa-user-pen', type: 'text' },
  { model: 'birthday', label: '生日', placeholder: '請輸入生日', icon: 'fa-solid fa-cake-candles', type: 'date' },
];

// 處理偏好更新
const updatePreferences = (newPreferences) => {
  form.value.preferences = newPreferences;
};

watch(
  userId,
  id => {
    if (id) userProfileStore.getUserProfile(id);
  },
  { immediate: true }
);

watch(
  () => profile.value,
  newProfile => {
    if (newProfile) {
      form.value.username = newProfile.username || '';
      form.value.nickname = newProfile.nickname || '';
      form.value.birthday = newProfile.birthday || '';
      form.value.preferences = newProfile.preferences || { types: [], moods: [] };
    }
  },
  { immediate: true }
);

const handleAvatarChange = (event) => {
  const file = event.target.files[0];
  if (file && file.type.startsWith('image/')) {
    avatarFile.value = file;
    avatarPreview.value = URL.createObjectURL(file);
  } else {
    alert('請選擇圖片檔案');
  }
};

const handleRemoveAvatar = () => {
    isAvatarRemoved.value = true;
    avatarFile.value = null;
    avatarPreview.value = defaultAvatar;
};

// 個人資料保存
const handleSaveProfile = async () => {
  isProfileSaving.value = true;
  
  const result = validateUserProfile(form.value);
  let valid = true;

  if (result.username) {
    errors.value.username = result.username;
    valid = false;
  } else {
    errors.value.username = '';
  }

  if (result.nickname) {
    errors.value.nickname = result.nickname;
    valid = false;
  } else {
    errors.value.nickname = '';
  }

  if (result.birthday) {
    errors.value.birthday = result.birthday;
    valid = false;
  } else {
    errors.value.birthday = '';
  }

  if (!valid) {
    isProfileSaving.value = false;
    return;
  }

  try {
    const submitData = {
      username: form.value.username,
      nickname: form.value.nickname === '' ? null : form.value.nickname,
      birthday: form.value.birthday === '' ? null : form.value.birthday,
      preferences: profile.value.preferences || { types: [], moods: [] },
    };

    let updatedAvatarUrl = profile.value.avatarUrl;

    await userProfileStore.updateUserProfile(userId.value, submitData);

    if (avatarFile.value) {
      updatedAvatarUrl = await updateUserAvatar(userId.value, avatarFile.value);
    } else if (isAvatarRemoved.value) {
      await removeUserAvatar(userId.value);
      updatedAvatarUrl = '';
    }

    avatarFile.value = null;
    avatarPreview.value = '';
    isAvatarRemoved.value = false;

    authStore.updateAuthUser({
      ...submitData,
      avatarUrl: updatedAvatarUrl,
    });

    await Swal.fire({
      title: '個人資料已儲存！',
      text: '您的個人資料已成功更新',
      icon: 'success',
      confirmButtonText: '確認',
      timer: 2000,
      timerProgressBar: true
    });

  } catch (err) {
    console.error('個人資料更新失敗', err);
    await Swal.fire({
      title: '儲存失敗',
      text: '個人資料更新失敗，請稍後再試',
      icon: 'error',
      confirmButtonText: '確認'
    });
  } finally {
    isProfileSaving.value = false;
  }
};

// 偏好設定保存
const handleSavePreferences = async () => {
  isPreferencesSaving.value = true;

  try {
    const preferencesData = {
      sport: form.value.preferences.types.includes('sport'),
      music: form.value.preferences.types.includes('music'),
      student: form.value.preferences.types.includes('student'),
      bistro: form.value.preferences.types.includes('bistro'),
      drink: form.value.preferences.types.includes('drink'),
      joy: form.value.preferences.moods.includes('joy'),
      romantic: form.value.preferences.moods.includes('romantic'),
      oldschool: form.value.preferences.moods.includes('oldschool'),
      highlevel: form.value.preferences.moods.includes('highlevel'),
      easy: form.value.preferences.moods.includes('easy')
    };

    const result = await authStore.saveBarTags(preferencesData);

    if (result.success) {
      const updatedProfileData = {
        ...profile.value,
        preferences: form.value.preferences
      };
      
      await userProfileStore.updateUserProfile(userId.value, updatedProfileData);

      await Swal.fire({
        title: '偏好設定已儲存！',
        text: '您的酒吧偏好已成功更新',
        icon: 'success',
        confirmButtonText: '確認',
        timer: 2000,
        timerProgressBar: true
      });
    } else {
      await Swal.fire({
        title: '儲存失敗',
        text: result.error || '偏好設定儲存失敗',
        icon: 'error',
        confirmButtonText: '確認'
      });
    }

  } catch (err) {
    console.error('偏好設定儲存失敗', err);
    await Swal.fire({
      title: '發生錯誤',
      text: '偏好設定儲存失敗，請稍後再試',
      icon: 'error',
      confirmButtonText: '確認'
    });
  } finally {
    isPreferencesSaving.value = false;
  }
};

const cancel = () => {
  router.push({ name: 'MemberProfile', params: { id: userId.value } });
};
</script>

<template>
  <transition name="alert-slide">
    <div v-if="showAlert" class="alert alert-success alert-soft absolute top-[5.5rem] left-[16rem] right-0 mx-auto max-w-md z-30">
      <svg class="w-6 h-6 stroke-current shrink-0" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>資料更新成功！</span>
    </div>
  </transition>

  <div v-if="isLoading" class="py-10 text-center">載入中...</div>

  <div v-else class="w-full max-w-4xl px-4 mx-auto mt-10">
    <div class="flex flex-col items-center gap-10 md:flex-row md:items-start">
      <!-- 左側：頭像 + 上傳 & 移除按鈕 -->
      <div class="flex flex-col items-center md:w-1/3">
        <UserAvatar 
        :avatar-url="avatarPreview || profile.avatarUrl || defaultAvatar" 
        :display-name="profile.username" 
        size="lg" />
        
        <label
          for="avatar"
          class="mt-4 px-4 py-2 bg-[var(--color-black)] text-[var(--color-secondary-pink)] rounded cursor-pointer hover:bg-opacity-80 active:scale-98 transition-all duration-150">
          <i class="mr-1 fa-solid fa-arrow-up-from-bracket"></i> 上傳頭像
        </label>
        <input type="file" hidden id="avatar" @change="handleAvatarChange" />
        
        <button
          type="button"
          v-if="!isDefaultAvatar"
          @click="handleRemoveAvatar"
          class="px-4 py-2 mt-2 text-white transition-all duration-150 bg-gray-400 rounded cursor-pointer active:scale-98">
          <i class="fa-solid fa-user-minus"></i> 移除頭像
        </button>
      </div>

      <!-- 右側：表單 + 按鈕 -->
      <div class="flex flex-col items-center w-full space-y-6 md:w-2/3 md:items-start">
        <!-- 個人資料編輯 -->
        <ProfileForm
          :form="form"
          :isEdit="true"
          :profileFields="profileFields"
          :errors="errors" />
        
        <!-- 個人資料保存按鈕 -->
        <div class="flex justify-center w-full">
          <button
            type="button"
            @click="handleSaveProfile"
            :disabled="isProfileSaving"
            class="px-6 py-2 font-medium text-white transition duration-300 transform bg-blue-500 rounded-lg shadow-md hover:scale-105 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
            <span v-if="isProfileSaving" class="flex items-center justify-center">
              <i class="mr-2 fa-solid fa-spinner fa-spin"></i>
              儲存中...
            </span>
            <span v-else>
              <i class="mr-2 fa-solid fa-user"></i>
              儲存個人資料
            </span>
          </button>
        </div>
        
        <!-- 偏好設定編輯 -->
        <PreferencesForm 
          :preferences="form.preferences"
          :isEdit="true"
          :showTitle="true"
          :showSaveButton="false"
          :enableApi="false"
          :autoLoad="false"
          @update:preferences="updatePreferences"
        />
        
        <!-- 🆕 偏好設定保存按鈕 -->
        <div class="flex justify-center w-full">
          <button
            type="button"
            @click="handleSavePreferences"
            :disabled="isPreferencesSaving"
            class="px-6 py-2 bg-gradient-to-r from-[var(--color-secondary-green)] via-[#d8dbaf] to-[var(--color-primary-orange)] text-[var(--color-black)] rounded-lg font-medium shadow-md transition duration-300 transform hover:scale-105 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
            <span v-if="isPreferencesSaving" class="flex items-center justify-center">
              <i class="mr-2 fa-solid fa-spinner fa-spin"></i>
              儲存中...
            </span>
            <span v-else>
              <i class="mr-2 fa-solid fa-heart"></i>
              儲存偏好設定
            </span>
          </button>
        </div>
        
        <!-- 取消按鈕 -->
        <div class="flex justify-center w-full mt-6">
          <button
            type="button"
            @click="cancel"
            class="px-6 py-2 text-gray-600 transition-all duration-150 bg-gray-200 rounded-lg cursor-pointer hover:bg-gray-300 active:scale-98">
            <i class="mr-2 fa-solid fa-times"></i>
            取消
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.alert-slide-enter-active {
  transition: all 0.4s ease-out;
}
.alert-slide-leave-active {
  transition: all 0.2s ease-in;
}
.alert-slide-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}
.alert-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>