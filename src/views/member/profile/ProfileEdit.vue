<script setup>
import { ref, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/stores/authStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useSuccessAlert } from '@/composables/useSuccessAlert';
import ProfileForm from '@/components/member/ProfileForm.vue';
import UserAvatar from '@/components/UserAvatar.vue';

const authStore = useAuthStore();
const userProfileStore = useUserProfileStore();
const { user } = storeToRefs(authStore);
const { profile, isLoading } = storeToRefs(userProfileStore);
const { updateUserAvatar } = userProfileStore;
const router = useRouter();
const { showAlert, triggerAlert } = useSuccessAlert();

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

const handleAvatarChange = event => {
  const file = event.target.files[0];
  if (file && file.type.startsWith('image/')) {
    avatarFile.value = file;
    avatarPreview.value = URL.createObjectURL(file); // 頭像即時預覽
  } else {
    alert('請選擇圖片檔案');
  }
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
      form.value.avatarUrl = newProfile.avatarUrl;
      form.value.preferences = newProfile.preferences || { types: [], moods: [] };
    }
  },
  { immediate: true }
);

const profileFields = [
  { model: 'username', label: '姓名', placeholder: '請輸入姓名', icon: 'fa-solid fa-user', type: 'text' },
  { model: 'nickname', label: '暱稱', placeholder: '請輸入暱稱', icon: 'fa-solid fa-user-pen', type: 'text' },
  { model: 'birthday', label: '生日', placeholder: '請輸入生日', icon: 'fa-solid fa-cake-candles', type: 'date' },
];
const barTypes = ['運動酒吧', '音樂酒吧', '學生酒吧', '餐酒館', '暢飲店'];
const barMoods = ['熱鬧歡樂', '浪漫私密', '復古懷舊', '高級精緻', '輕鬆悠閒'];

const toggleSelection = (arr, value) => {
  const index = arr.indexOf(value);
  if (index > -1) arr.splice(index, 1);
  else arr.push(value);
};

const handleSubmit = async () => {
  try {
    await userProfileStore.updateUserProfile(userId.value, form.value);
    if (avatarFile.value) {
      await updateUserAvatar(userId.value, avatarFile.value);
      form.value.avatarUrl = userProfileStore.profile.avatarUrl;
    }
    authStore.updateAuthUser(form.value);
    triggerAlert();

    setTimeout(() => {
      router.push({ name: 'MemberProfile', params: { id: userId.value } });
    }, 1500);
  } catch (err) {
    alert('更新失敗');
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
      <!-- 左側：頭像 + 上傳按鈕 -->
      <div class="flex flex-col items-center md:w-1/3">
        <UserAvatar
          :avatar-url="avatarPreview || profile.avatarUrl || '/default-user-avatar.png'"
          :display-name="profile.username"
          size="lg"
        />
        <label
          for="avatar"
          class="mt-4 px-4 py-2 bg-[var(--color-black)] text-[var(--color-secondary-pink)] rounded cursor-pointer hover:bg-opacity-80 active:scale-98 transition-all duration-150">
          <i class="fa-solid fa-arrow-up-from-bracket mr-1"></i> 上傳頭像
        </label>
        <input type="file" hidden id="avatar" @change="handleAvatarChange" />
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
        />
        <div class="mt-4 flex gap-2">
          <button type="button" @click="cancel" class="px-4 py-2 bg-gray-400 text-white rounded cursor-pointer">取消</button>
          <button type="submit" class="px-4 py-2 bg-[var(--color-primary-orange)] text-white rounded cursor-pointer">儲存</button>
        </div>
      </div>
    </form>
  </div>
</template>
