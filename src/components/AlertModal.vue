<script setup>
const props = defineProps({
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
const emit = defineEmits(['accept', 'deny'])
</script>

<template>
  <transition name="fade-scale">
    <div v-if="visible" class="fixed inset-0 flex items-center justify-center z-[199]">
      <!-- 黑色+模糊背景 -->
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      <!-- Alert本體 -->
      <div class="flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl w-96 max-w-[90vw] p-6">
      <!-- 標題 -->
      <h3 class="text-lg font-semibold text-gray-900 mb-2">
        您即將離開表單
      </h3>
      
      <!-- 訊息內容 -->
      <p class="text-sm text-gray-600 mb-6 leading-relaxed">
        {{ props.message }}
      </p>
      
      <!-- 按鈕區域 -->
      <div class="flex justify-end gap-3">
        <button 
          @click="emit('deny')"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
        >
          {{ props.denyText }}
        </button>
        <button 
          @click="emit('accept')"
          class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
        >
          {{ props.acceptText }}
        </button>
      </div>
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

