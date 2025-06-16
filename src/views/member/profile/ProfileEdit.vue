<script setup>
import { ref, watch,computed } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import ProfileForm from '@/components/member/ProfileForm.vue';

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);
const userProfileStore = useUserProfileStore();
const { profile, isLoading } = storeToRefs(userProfileStore);

const router = useRouter();

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
    alert('更新資料成功');
    router.push({ name: 'MemberProfile', params: { id: userId.value } });
  } catch (err) {
    alert('更新資料失敗');
  }
};

const cancel = () => {
  router.push({ name: 'MemberProfile', params: { id: userId.value } });
};
</script>

<template>
  <div
    v-if="isLoading"
    class="text-center py-10">
    載入中...
  </div>
  <div v-else>
    <form @submit.prevent="handleSubmit">
      <ProfileForm
        :form="form"
        :isEdit="true"
        :profileFields="profileFields"
        :barTypes="barTypes"
        :barMoods="barMoods"
        :toggleSelection="toggleSelection" />
      <div class="mt-6 flex justify-center gap-4">
        <button
          type="submit"
          class="px-4 py-2 bg-green-600 text-white rounded">
          儲存
        </button>
        <button
          type="button"
          @click="cancel"
          class="ml-2 px-4 py-2 bg-gray-400 text-white rounded">
          取消
        </button>
      </div>
    </form>
  </div>
</template>
