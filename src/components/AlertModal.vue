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
  <transition name="fade-scale">
    <div v-if="visible" class="fixed inset-0 flex items-center justify-center z-[199]">
      <!-- 黑色+模糊背景 -->
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      <!-- Alert本體 -->
      <div
        class="relative alert alert-vertical sm:alert-horizontal w-96 max-h-[80vh] bg-white shadow-lg z-[200]"
        role="alert"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-info h-6 w-6 shrink-0">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span>{{ message }}</span>
        <div>
          <button class="btn btn-sm" @click="$emit('deny')">{{ denyText }}</button>
          <button class="btn btn-sm btn-primary" @click="$emit('accept')">{{ acceptText }}</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.fade-scale-enter-active {
  transition: all 0.2s cubic-bezier(.4,0,.2,1);
}
.fade-scale-leave-active {
  transition: all 0.15s cubic-bezier(.4,0,.2,1);
}
.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
.fade-scale-enter-to,
.fade-scale-leave-from {
  opacity: 1;
  transform: scale(1);
}
</style>

