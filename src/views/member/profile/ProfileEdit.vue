<script setup>
import { ref, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/stores/authStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useSuccessAlert } from '@/composables/useSuccessAlert';
import ProfileForm from '@/components/member/ProfileForm.vue';
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

const barTypes = [
  { key: 'sport', label: '運動酒吧', icon: 'fa-solid fa-football' },
  { key: 'music', label: '音樂酒吧', icon: 'fa-solid fa-music' },
  { key: 'student', label: '學生酒吧', icon: 'fa-solid fa-graduation-cap' },
  { key: 'bistro', label: '餐酒館', icon: 'fa-solid fa-utensils' },
  { key: 'drink', label: '暢飲店', icon: 'fa-solid fa-beer' }
];

const barMoods = [
  { key: 'joy', label: '熱鬧歡樂', icon: 'fa-solid fa-champagne-glasses' },
  { key: 'romantic', label: '浪漫私密', icon: 'fa-solid fa-heart' },
  { key: 'oldschool', label: '復古懷舊', icon: 'fa-solid fa-record-vinyl' },
  { key: 'highlevel', label: '高級精緻', icon: 'fa-solid fa-crown' },
  { key: 'easy', label: '輕鬆悠閒', icon: 'fa-solid fa-leaf' }
];

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

const toggleSelection = (arr, value) => {
  const index = arr.indexOf(value);
  if (index > -1) arr.splice(index, 1);
  else arr.push(value);
};

const handleAvatarChange = (event) => {
  const file = event.target.files[0];
  if (file && file.type.startsWith('image/')) {
    avatarFile.value = file;
    avatarPreview.value = URL.createObjectURL(file); // 頭像即時預覽
  } else {
    alert('請選擇圖片檔案');
  }
};

const handleRemoveAvatar = () => {
    isAvatarRemoved.value = true;
    avatarFile.value = null;
    avatarPreview.value = defaultAvatar;
};

const handleSubmit = async () => {
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

  if (!valid) return;

  try {
    const submitData = {
      username: form.value.username,
      nickname: form.value.nickname === '' ? null : form.value.nickname,
      birthday: form.value.birthday === '' ? null : form.value.birthday,
      preferences: form.value.preferences,
    };

    let updatedAvatarUrl = profile.value.avatarUrl;

    await userProfileStore.updateUserProfile(userId.value, submitData);

    if (avatarFile.value) {
      updatedAvatarUrl = await updateUserAvatar(userId.value, avatarFile.value);
    // 如果使用者未上傳新頭像 & 按了移除頭像，則呼叫移除頭像 API
    } else if (isAvatarRemoved.value) {
      await removeUserAvatar(userId.value);
      updatedAvatarUrl = '';
    }

    authStore.updateAuthUser({
      ...submitData,
      avatarUrl: updatedAvatarUrl,
    });

    triggerAlert();
    setTimeout(() => {
      router.push({ name: 'MemberProfile', params: { id: userId.value } });
    }, 1500);
  } catch (err) {
    console.error('會員資料更新失敗', err);
    alert('會員資料更新失敗');
  }
};

const cancel = () => {
  router.push({ name: 'MemberProfile', params: { id: userId.value } });
};
</script>

<template>
  <transition name="alert-slide">
    <div v-if="showAlert" class="alert alert-success alert-soft absolute top-[5.5rem] left-[16rem] right-0 mx-auto max-w-md z-30">
      <svg class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>資料更新成功！</span>
    </div>
  </transition>

  <div v-if="isLoading" class="text-center py-10">載入中...</div>

  <div v-else class="w-full max-w-4xl mx-auto mt-10 px-4">
    <form @submit.prevent="handleSubmit" class="flex flex-col md:flex-row items-center md:items-start gap-10">
      <!-- 左側：頭像 + 上傳 & 移除按鈕 -->
      <div class="flex flex-col items-center md:w-1/3">
        <UserAvatar 
        :avatar-url="avatarPreview || profile.avatarUrl || defaultAvatar" 
        :display-name="profile.username" 
        size="lg" />
        <label
          for="avatar"
          class="mt-4 px-4 py-2 bg-[var(--color-black)] text-[var(--color-secondary-pink)] rounded cursor-pointer hover:bg-opacity-80 active:scale-98 transition-all duration-150">
          <i class="fa-solid fa-arrow-up-from-bracket mr-1"></i> 上傳頭像
        </label>
        <input type="file" hidden id="avatar" @change="handleAvatarChange" />
        <button
          type="button"
          v-if="!isDefaultAvatar"
          @click="handleRemoveAvatar"
          class="mt-2 px-4 py-2 bg-gray-400 text-white rounded cursor-pointer active:scale-98 transition-all duration-150">
          <i class="fa-solid fa-user-minus"></i> 移除頭像
        </button>
      </div>

      <!-- 右側：表單 + 按鈕 -->
      <div class="w-full md:w-2/3 space-y-6 flex flex-col items-center md:items-start">
        <ProfileForm
          :form="form"
          :isEdit="true"
          :profileFields="profileFields"
          :barTypes="barTypes"
          :barMoods="barMoods"
          :toggleSelection="toggleSelection"
          :errors="errors" />
        <div class="mt-4 flex gap-2">
          <button
            type="button"
            @click="cancel"
            class="px-4 py-2 bg-gray-400 text-white rounded cursor-pointer active:scale-98 transition-all duration-150">
            取消
          </button>
          <button
            type="submit"
            class="px-4 py-2 bg-[var(--color-primary-orange)] text-white rounded cursor-pointer active:scale-98 transition-all duration-150">
            儲存
          </button>
        </div>
      </div>
    </form>
  </div>
</template>
