<script setup>
import { computed } from 'vue';

const props = defineProps({
  visible: Boolean,
  title: String,
  message: String,
  type: {
    type: String,
    default: 'default',
    validator: (value) => ['success', 'error', 'warning', 'info', 'default'].includes(value)
  },
  confirmText: {
    type: String,
    default: '確認'
  }
})
const emit = defineEmits(['close'])

function onClose() {
  emit('close')
}

// 根據類型設置按鈕
const buttonClass = computed(() => {
  const classes = {
    success: 'text-[var(--color-black)] bg-gradient-to-r from-[#a9ebd4] to-[#02bc7d]',
    error: 'text-white bg-gradient-to-r from-red-500 to-red-600',
    warning: 'text-white bg-gradient-to-r from-yellow-500 to-yellow-600',
    info: 'text-white bg-gradient-to-r from-blue-500 to-blue-600',
    default: 'text-[var(--color-black)] bg-gradient-to-r from-[#a9ebd4] to-[#02bc7d]'
  }
  return classes[props.type] || classes.default
})
</script>

<template>
  <transition name="modal-fade">
    <div
      v-if="visible"
      class="modal-overlay"
      @click.self="onClose"
    >
      <div class="modal-content">
        <slot name="icon">
          <!-- 根據類型顯示不同圖標 -->
          <img v-if="type === 'success'" src="/checkmark.png" class="w-12 h-12 mx-auto" alt="成功 icon" />

          <div v-else-if="type === 'error'" class="flex items-center justify-center w-16 h-16 mx-auto bg-red-100 rounded-full">
            <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>

          <div v-else-if="type === 'warning'" class="flex items-center justify-center w-16 h-16 mx-auto bg-yellow-100 rounded-full">
            <svg class="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>

          <div v-else-if="type === 'info'" class="flex items-center justify-center w-16 h-16 mx-auto bg-blue-100 rounded-full">
            <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>

          <div v-else class="flex items-center justify-center w-16 h-16 mx-auto bg-green-100 rounded-full">
            <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>

        </slot>

        <h2 class="text-xl font-semibold text-gray-800">{{ title }}</h2>
        <p class="text-sm leading-relaxed text-gray-600">{{ message }}</p>

        <button
          @click="onClose" 
          :class="buttonClass"
          class="px-6 py-2 mt-4 font-semibold transition transform rounded-sm hover:scale-105">
          {{ confirmText }}
        </button>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999 !important;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.4);
}

.modal-content {
  width: 100%;
  max-width: 28rem;
  padding: 1.5rem;
  space-y: 1rem;
  text-align: center;
  background-color: white;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border-radius: 1rem;
  z-index: 99999 !important;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>