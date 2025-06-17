<script setup>
import { ref, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/stores/authStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { useSuccessAlert } from '@/composables/useSuccessAlert';
import ProfileForm from '@/components/member/ProfileForm.vue';
import UserAvatar from '@/components/UserAvatar.vue';
import { uploadUserAvatar } from '@/api/uploadUserAvatar';

const authStore = useAuthStore();
const userProfileStore = useUserProfileStore();
const { user } = storeToRefs(authStore);
const { profile, isLoading } = storeToRefs(userProfileStore);
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

const profileFields = [
  { model: 'username', placeholder: '姓名', icon: 'fa-solid fa-user', type: 'text' },
  { model: 'nickname', placeholder: '暱稱', icon: 'fa-solid fa-user-pen', type: 'text' },
  { model: 'birthday', placeholder: '生日', icon: 'fa-solid fa-cake-candles', type: 'date' },
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
    <div
      v-if="showAlert"
      class="alert alert-success alert-soft absolute top-[5.5rem] left-[16rem] right-0 mx-auto max-w-md z-30">
      <svg
        class="h-6 w-6 shrink-0 stroke-current"
        fill="none"
        viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>資料更新成功！</span>
    </div>
  </transition>
  <div
    v-if="isLoading"
    class="text-center py-10">
    載入中...
  </div>
  <div v-else class="flex flex-col items-center">
    <div class="flex flex-col items-center mb-6">
      <UserAvatar
        :avatar-url="profile.avatarUrl || '/default-user-avatar.png'"
        :display-name="profile.username"
        size="lg" />
    </div>
    <div>
      <label
        for="avatar"
        class="bg-[var(--color-black)] text-[var(--color-secondary-pink)] p-2 rounded"
        >上傳頭像</label>
      <input
        type="file"
        hidden
        id="avatar" />
    </div>
    <form @submit.prevent="handleSubmit">
      <ProfileForm
        :form="form"
        :isEdit="true"
        :profileFields="profileFields"
        :barTypes="barTypes"
        :barMoods="barMoods"
        :toggleSelection="toggleSelection" />
      <div class="mt-6 ">
        <button
          type="submit"
          class="px-4 py-2 bg-green-600 text-white rounded cursor-pointer">
          儲存
        </button>
        <button
          type="button"
          @click="cancel"
          class="ml-2 px-4 py-2 bg-gray-400 text-white rounded cursor-pointer">
          取消
        </button>
      </div>
    </form>
  </div>
</template>
