<script setup>
import { ref, watch, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/stores/authStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import ProfileForm from '@/components/member/ProfileForm.vue';
import PreferencesForm from '@/components/member/PreferencesForm.vue';
import UserAvatar from '@/components/UserAvatar.vue';
import { validateUserProfile } from '@/utils/validators.js';
import Swal from 'sweetalert2';

const authStore = useAuthStore();
const userProfileStore = useUserProfileStore();
const router = useRouter();
const route = useRoute();

const { user } = storeToRefs(authStore);
const { profile, isLoading } = storeToRefs(userProfileStore);
const { updateUserAvatar, removeUserAvatar } = userProfileStore;

const userId = computed(() => user.value?.id);

// 根據 URL 參數決定初始編輯模式
const initialEditMode = computed(() => {
  const mode = route.query.mode;
  if (mode === 'profile') return 'profile';
  if (mode === 'preferences') return 'preferences';
  return 'none';
});

const editMode = ref('none');

// 表單資料
const profileForm = ref({
  username: '',
  nickname: '',
  birthday: ''
});

const preferencesForm = ref({
  types: [],
  moods: []
});

// 頭像相關
const avatarFile = ref(null);
const avatarPreview = ref('');
const defaultAvatar = '/default-user-avatar.png';
const isAvatarRemoved = ref(false);

// 載入狀態
const isProfileSaving = ref(false);
const isPreferencesSaving = ref(false);

// 錯誤狀態
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

const isDefaultAvatar = computed(() => {
  const currentUrl = avatarPreview.value || profile.value?.avatarUrl;
  if (!currentUrl || currentUrl.includes(defaultAvatar)) {
    return true;
  }
  return false;
});

// 監聽用戶資料載入
watch(
  userId,
  id => {
    if (id) userProfileStore.getUserProfile(id);
  },
  { immediate: true }
);

// 監聽 profile 變化，同步到表單
watch(
  () => profile.value,
  newProfile => {
    if (newProfile) {
      profileForm.value = {
        username: newProfile.username || '',
        nickname: newProfile.nickname || '',
        birthday: newProfile.birthday || ''
      };
      preferencesForm.value = {
        types: newProfile.preferences?.types || [],
        moods: newProfile.preferences?.moods || []
      };
    }
  },
  { immediate: true }
);

// 根據 URL 參數自動進入編輯模式
onMounted(() => {
  editMode.value = initialEditMode.value;
});

// 編輯模式控制
const startProfileEdit = () => {
  editMode.value = 'profile';
  // 重置表單資料
  profileForm.value = {
    username: profile.value.username || '',
    nickname: profile.value.nickname || '',
    birthday: profile.value.birthday || ''
  };
  // 清除錯誤
  errors.value = { username: '', nickname: '', birthday: '' };
};

const startPreferencesEdit = () => {
  editMode.value = 'preferences';
  // 重置表單資料
  preferencesForm.value = {
    types: [...(profile.value.preferences?.types || [])],
    moods: [...(profile.value.preferences?.moods || [])]
  };
};

const cancelEdit = () => {
  editMode.value = 'none';
  // 重置頭像相關狀態
  avatarFile.value = null;
  avatarPreview.value = '';
  isAvatarRemoved.value = false;
  // 清除錯誤
  errors.value = { username: '', nickname: '', birthday: '' };
  
  // 清除 URL 參數
  router.replace({ query: {} });
};

const goBack = () => {
  router.push({ name: 'MemberProfile', params: { id: userId.value } });
};

// 處理偏好更新
const updatePreferences = (newPreferences) => {
  preferencesForm.value = newPreferences;
};

// 頭像處理
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
const saveProfile = async () => {
  isProfileSaving.value = true;
  
  // 驗證
  const result = validateUserProfile(profileForm.value);
  let valid = true;

  Object.keys(result).forEach(key => {
    if (result[key]) {
      errors.value[key] = result[key];
      valid = false;
    } else {
      errors.value[key] = '';
    }
  });

  if (!valid) {
    isProfileSaving.value = false;
    return;
  }

  try {
    const submitData = {
      username: profileForm.value.username,
      nickname: profileForm.value.nickname === '' ? null : profileForm.value.nickname,
      birthday: profileForm.value.birthday === '' ? null : profileForm.value.birthday,
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

    // 保存後返回查看頁面
    goBack();

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
const savePreferences = async () => {
  isPreferencesSaving.value = true;

  try {
    if (!userId.value) {
      throw new Error('用戶ID不存在');
    }

    const preferencesData = {
      sport: Array.isArray(preferencesForm.value.types) ? preferencesForm.value.types.includes('sport') : false,
      music: Array.isArray(preferencesForm.value.types) ? preferencesForm.value.types.includes('music') : false,
      student: Array.isArray(preferencesForm.value.types) ? preferencesForm.value.types.includes('student') : false,
      bistro: Array.isArray(preferencesForm.value.types) ? preferencesForm.value.types.includes('bistro') : false,
      drink: Array.isArray(preferencesForm.value.types) ? preferencesForm.value.types.includes('drink') : false,
      joy: Array.isArray(preferencesForm.value.moods) ? preferencesForm.value.moods.includes('joy') : false,
      romantic: Array.isArray(preferencesForm.value.moods) ? preferencesForm.value.moods.includes('romantic') : false,
      oldschool: Array.isArray(preferencesForm.value.moods) ? preferencesForm.value.moods.includes('oldschool') : false,
      highlevel: Array.isArray(preferencesForm.value.moods) ? preferencesForm.value.moods.includes('highlevel') : false,
      easy: Array.isArray(preferencesForm.value.moods) ? preferencesForm.value.moods.includes('easy') : false
    };

    if (typeof authStore.updateBarTags !== 'function') {
      throw new Error('authStore.updateBarTags 不是一個函數');
    }

    const result = await authStore.updateBarTags(preferencesData);

    if (result.success) {

      const updatedProfileData = {
        ...profile.value,
        preferences: {
          types: [...(preferencesForm.value.types || [])],
          moods: [...(preferencesForm.value.moods || [])]
        }
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

      goBack();
    } else {
      await Swal.fire({
        title: '儲存失敗',
        text: result.error || '偏好設定儲存失敗，請稍後再試',
        icon: 'error',
        confirmButtonText: '確認'
      });
    }

  } catch (err) {
    await Swal.fire({
      title: '發生錯誤',
      text: `錯誤詳情: ${err.message}`,
      icon: 'error',
      confirmButtonText: '確認'
    });
  } finally {
    isPreferencesSaving.value = false;
  }
};
</script>

<template>
  <div v-if="isLoading" class="py-10 text-center">載入中...</div>
  <div v-else class="w-full max-w-4xl px-4 mx-auto mt-10">
    <!-- 返回按鈕 -->
    <div class="mb-6">
      <button 
        @click="goBack"
        class="flex items-center px-4 py-2 text-gray-600 transition-all duration-150 bg-gray-100 rounded-lg hover:bg-gray-200 active:scale-98">
        <i class="mr-2 fa-solid fa-arrow-left"></i>
        返回個人資料
      </button>
    </div>

    <div class="flex flex-col items-center gap-10 md:flex-row md:items-start">
      <!-- 左側：會員頭像 -->
      <div class="flex flex-col items-center md:w-1/3">
        <UserAvatar 
          :avatar-url="avatarPreview || profile.avatarUrl || '/default-user-avatar.png'" 
          :display-name="profile.username" 
          :show-name="false" 
          size="lg" />

        <!-- 🆕 頭像編輯（只在個人資料編輯模式顯示）-->
        <template v-if="editMode === 'profile'">
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
        </template>
      </div>

      <!-- 右側：個人資料 + 酒吧偏好 -->
      <div class="flex flex-col items-center w-full space-y-6 md:w-2/3 md:items-start">
        
        <!-- 🆕 個人資料區塊 -->
        <div class="w-full">
          <h2 class="text-xl font-semibold mb-4 text-[var(--color-primary-orange)]">個人資料</h2>
          <ProfileForm
            :form="editMode === 'profile' ? profileForm : profile"
            :isEdit="editMode === 'profile'"
            :profileFields="profileFields"
            :errors="errors" />
          
          <!-- 個人資料按鈕區 -->
          <div class="flex justify-center w-full mt-4">
            <template v-if="editMode === 'profile'">
              <!-- 編輯模式：保存和取消 -->
              <div class="flex gap-3">
                <button
                  @click="saveProfile"
                  :disabled="isProfileSaving"
                  class="px-6 py-2 font-medium text-white transition duration-300 transform bg-blue-500 rounded-lg shadow-md hover:scale-105 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
                  <span v-if="isProfileSaving" class="flex items-center justify-center">
                    <i class="mr-2 fa-solid fa-spinner fa-spin"></i>
                    儲存中...
                  </span>
                  <span v-else>
                    <i class="mr-2 fa-solid fa-save"></i>
                    儲存
                  </span>
                </button>
                <button
                  @click="cancelEdit"
                  class="px-6 py-2 text-gray-600 transition-all duration-150 bg-gray-200 rounded-lg cursor-pointer hover:bg-gray-300 active:scale-98">
                  <i class="mr-2 fa-solid fa-times"></i>
                  取消
                </button>
              </div>
            </template>
            <template v-else>
              <!-- 查看模式：編輯按鈕（只有在偏好編輯時才禁用）-->
              <button
                @click="startProfileEdit"
                :disabled="editMode === 'preferences'"
                class="px-4 py-2 text-white transition-all duration-150 bg-blue-500 rounded cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600">
                <i class="mr-2 fa-solid fa-user"></i>
                編輯個人資料
              </button>
            </template>
          </div>
        </div>
        
        <!-- 🆕 偏好設定區塊 -->
        <div class="w-full">
          <PreferencesForm 
            :preferences="editMode === 'preferences' ? preferencesForm : profile.preferences"
            :isEdit="editMode === 'preferences'"
            :showTitle="true"
            @update:preferences="updatePreferences"
          />
          
          <!-- 偏好設定按鈕區 -->
          <div class="flex justify-center w-full mt-4">
            <template v-if="editMode === 'preferences'">
              <!-- 編輯模式：保存和取消 -->
              <div class="flex gap-3">
                <button
                  @click="savePreferences"
                  :disabled="isPreferencesSaving"
                  class="px-6 py-2 bg-gradient-to-r from-[var(--color-secondary-green)] via-[#d8dbaf] to-[var(--color-primary-orange)] text-[var(--color-black)] rounded-lg font-medium shadow-md transition duration-300 transform hover:scale-105 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
                  <span v-if="isPreferencesSaving" class="flex items-center justify-center">
                    <i class="mr-2 fa-solid fa-spinner fa-spin"></i>
                    儲存中...
                  </span>
                  <span v-else>
                    <i class="mr-2 fa-solid fa-save"></i>
                    儲存
                  </span>
                </button>
                <button
                  @click="cancelEdit"
                  class="px-6 py-2 text-gray-600 transition-all duration-150 bg-gray-200 rounded-lg cursor-pointer hover:bg-gray-300 active:scale-98">
                  <i class="mr-2 fa-solid fa-times"></i>
                  取消
                </button>
              </div>
            </template>
            <template v-else>
              <!-- 查看模式：編輯按鈕（只有在個人資料編輯時才禁用）-->
              <button
                @click="startPreferencesEdit"
                :disabled="editMode === 'profile'"
                class="px-4 py-2 bg-[var(--color-primary-orange)] text-white rounded cursor-pointer active:scale-98 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110">
                <i class="mr-2 fa-solid fa-heart"></i>
                編輯偏好設定
              </button>
            </template>
          </div>
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