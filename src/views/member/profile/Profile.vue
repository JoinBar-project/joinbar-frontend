<script setup>
import { ref, onMounted, watch } from 'vue';
import { useAuthStore } from '@/api/auth';
import { useUserProfileStore } from '@/stores/userProfileStore';
import { storeToRefs } from 'pinia';
const authStore = useAuthStore();
const { user } = storeToRefs(authStore);

const userProfileStore = useUserProfileStore();
const { profile } = storeToRefs(userProfileStore);

const form = ref({
  username: '',
  nickname: '',
  birthday: '',
  preferences: {
    types: [],
    moods: [],
  },
});

watch(
  () => user.value?.id,
  id => {
    if (id) {
      userProfileStore.getUserProfile(id);
    }
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

const handleSubmit = () => {
  console.log('修改成功:', form.value);
  alert('修改成功！');
};
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-4 w-full max-w-md mx-auto mt-8">
    <div v-for="(field, index) in profileFields" :key="index" class="flex items-center border border-gray-300 rounded px-3 py-2 mb-3 bg-white">
      <i :class="field.icon" class="text-gray-400 mr-2"></i>
      <input
        :type="field.type"
        v-model="form[field.model]"
        :placeholder="field.placeholder"
        class="w-full outline-none text-[#860914] placeholder-[#860914] bg-transparent" />
    </div>

    <div class="space-y-4 mt-6">
      <h2 class="text-xl font-semibold mb-4 text-[#860914]">酒吧偏好</h2>

      <div>
        <h3 class="text-lg font-medium mb-2 text-[#aa666c]">酒吧類型</h3>
        <div class="grid grid-cols-3 grid-rows-2 gap-3">
          <button
            type="button"
            v-for="type in barTypes"
            :key="type"
            @click="toggleSelection(form.preferences.types, type)"
            :class="[
              'text-sm py-2 rounded-full border transition duration-200 cursor-pointer',
              form.preferences.types.includes(type) ? 'bg-[#860914] text-white border-[#860914]' : 'bg-[#3A3435] text-[#f8ecec] border-[#3A3435]',
            ]">
            {{ type }}
          </button>
        </div>
      </div>

      <div>
        <h3 class="text-lg font-medium mb-2 text-[#aa666c]">酒吧氛圍</h3>
        <div class="grid grid-cols-3 grid-rows-2 gap-2">
          <button
            type="button"
            v-for="mood in barMoods"
            :key="mood"
            @click="toggleSelection(form.preferences.moods, mood)"
            :class="[
              'text-sm py-2 rounded-full border transition duration-200 cursor-pointer',
              form.preferences.moods.includes(mood) ? 'bg-[#860914] text-white border-[#860914]' : 'bg-[#3A3435] text-[#f8ecec] border-[#3A3435]',
            ]">
            {{ mood }}
          </button>
        </div>
      </div>
    </div>
    <button type="button" class="bg-gray-800 text-white px-4 py-2 rounded">編輯</button>
  </form>
</template>
