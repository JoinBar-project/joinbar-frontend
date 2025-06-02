<script setup>
defineProps({
  visible: Boolean,
  message: {
    type: String,
    default: "確定要關閉編輯視窗嗎？未儲存的內容將會遺失。"
  },
  denyText: {
    type: String,
    default: "取消"
  },
  acceptText: {
    type: String,
    default: "確定關閉"
  }
});
</script>

<template>
  <div v-if="visible" class="alert alert-vertical sm:alert-horizontal fixed left-1/2 top-1/2 z-[200] -translate-x-1/2 -translate-y-1/2 bg-white shadow-lg" role="alert">
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-info h-6 w-6 shrink-0">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>
    <span>{{ message }}</span>
    <div>
      <button class="btn btn-sm" @click="$emit('deny')">{{ denyText }}</button>
      <button class="btn btn-sm btn-primary" @click="$emit('accept')">{{ acceptText }}</button>
    </div>
  </div>
</template>


