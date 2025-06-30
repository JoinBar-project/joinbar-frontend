<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  preferences: {
    type: Object,
    default: () => ({ types: [], moods: [] })
  },
  isEdit: {
    type: Boolean,
    default: true
  },
  showTitle: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['update:preferences']);

const internalPreferences = ref({
  types: [],
  moods: []
});

// 酒吧類型
const barTypes = [
  { key: 'sport', label: '運動酒吧', icon: 'fa-solid fa-football' },
  { key: 'music', label: '音樂酒吧', icon: 'fa-solid fa-music' },
  { key: 'student', label: '學生酒吧', icon: 'fa-solid fa-graduation-cap' },
  { key: 'bistro', label: '餐酒館', icon: 'fa-solid fa-utensils' },
  { key: 'drink', label: '暢飲店', icon: 'fa-solid fa-beer' }
];

// 酒吧氛圍
const barMoods = [
  { key: 'joy', label: '熱鬧歡樂', icon: 'fa-solid fa-party-horn' },
  { key: 'romantic', label: '浪漫私密', icon: 'fa-solid fa-heart' },
  { key: 'oldschool', label: '復古懷舊', icon: 'fa-solid fa-record-vinyl' },
  { key: 'highlevel', label: '高級精緻', icon: 'fa-solid fa-crown' },
  { key: 'easy', label: '輕鬆悠閒', icon: 'fa-solid fa-leaf' }
];

const toggleSelection = (arr, value) => {
  if (!props.isEdit) return;
  
  const index = arr.indexOf(value);
  if (index > -1) {
    arr.splice(index, 1);
  } else {
    arr.push(value);
  }
  
  // 發送更新事件
  emit('update:preferences', {
    types: [...internalPreferences.value.types],
    moods: [...internalPreferences.value.moods]
  });
};

// 監聽傳入的 preferences 變化
watch(() => props.preferences, (newPreferences) => {
  if (newPreferences) {
    internalPreferences.value.types = [...(newPreferences.types || [])];
    internalPreferences.value.moods = [...(newPreferences.moods || [])];
  }
}, { deep: true, immediate: true });

// 父組件使用
defineExpose({
  getPreferences: () => ({ ...internalPreferences.value })
});
</script>

<template>
  <div class="space-y-5">
    <div v-if="showTitle">
      <h2 class="text-xl font-semibold mb-4 text-[var(--color-primary-orange)]">酒吧偏好</h2>
    </div>

    <div>
      <h3 class="text-base font-semibold mb-3 text-[var(--color-secondary-green)]">
        選擇你喜歡的酒吧類型
      </h3>
      <div class="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3">
        <button 
          v-for="type in barTypes" 
          :key="type.key"
          @click="toggleSelection(internalPreferences.types, type.key)"
          :disabled="!isEdit"
          :class="[
            'text-xs md:text-sm py-3 px-2 rounded-lg border transition-all duration-200 flex flex-col items-center justify-center min-h-[75px] md:min-h-[80px] hover:scale-105',
            internalPreferences.types.includes(type.key)
              ? 'bg-[var(--color-primary-orange)] text-white border-[var(--color-primary-orange)] shadow-md'
              : 'bg-[var(--color-icon-secondary)] text-[var(--color-black)] border-[var(--color-icon-secondary)] hover:bg-gray-300',
            isEdit ? 'cursor-pointer' : 'cursor-default opacity-70'
          ]">
          <i :class="type.icon + ' text-base md:text-lg mb-1'"></i>
          <span class="font-medium leading-tight text-center">{{ type.label }}</span>
        </button>
      </div>
    </div>

    <div class="flex items-center my-4">
      <div class="flex-grow h-px bg-gray-300"></div>
      <span class="px-4 text-sm text-gray-300">和</span>
      <div class="flex-grow h-px bg-gray-300"></div>
    </div>

    <div>
      <h3 class="text-base font-semibold mb-3 text-[var(--color-secondary-green)]">
        選擇你喜歡的酒吧氛圍
      </h3>
      <div class="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3">
        <button 
          v-for="mood in barMoods" 
          :key="mood.key"
          @click="toggleSelection(internalPreferences.moods, mood.key)"
          :disabled="!isEdit"
          :class="[
            'text-xs md:text-sm py-3 px-2 rounded-lg border transition-all duration-200 flex flex-col items-center justify-center min-h-[75px] md:min-h-[80px] hover:scale-105',
            internalPreferences.moods.includes(mood.key)
              ? 'bg-[var(--color-primary-orange)] text-white border-[var(--color-primary-orange)] shadow-md'
              : 'bg-[var(--color-icon-secondary)] text-[var(--color-black)] border-[var(--color-icon-secondary)] hover:bg-gray-300',
            isEdit ? 'cursor-pointer' : 'cursor-default opacity-70'
          ]">
          <i :class="mood.icon + ' text-base md:text-lg mb-1'"></i>
          <span class="font-medium leading-tight text-center">{{ mood.label }}</span>
        </button>
      </div>
    </div>

    <!-- 編輯模式顯示 -->
    <div v-if="isEdit" class="pt-4 mt-4 text-center border-t border-gray-300">
      <p class="px-4 text-xs text-gray-300">
        修改後會立即更新您的推薦結果
      </p>
    </div>
  </div>
</template>

<style scoped>
@media (max-width: 767px) {
  button {
    min-height: 44px;
  }
}
</style>