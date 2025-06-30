<template>
  <transition name="modal-fade">
    <div 
      v-if="visible" 
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" 
      @click.self="onCancel"
    >
      <div class="w-full max-w-md p-6 space-y-4 bg-white shadow-xl rounded-2xl">

        <!-- 可選的圖標區域 -->
        <div v-if="type" class="flex justify-center mb-2">
          <div 
            class="flex items-center justify-center w-12 h-12 rounded-full"
            :class="iconBackgroundClass"
          >
            <svg v-if="type === 'warning'" class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>

            <svg v-else-if="type === 'danger'" class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>

            <svg v-else-if="type === 'question'" class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
        </div>

        <h2 class="text-lg font-bold text-center text-gray-900">{{ title }}</h2>
        <p class="text-sm leading-relaxed text-center text-gray-700">{{ message }}</p>

        <div class="flex justify-center gap-4 pt-2">
          <button
            @click="onCancel"
            class="px-6 py-2 text-gray-700 transition border border-gray-300 rounded-sm hover:bg-gray-100 hover:scale-105 min-w-[80px]">
            {{ cancelText }}
          </button>
          <button
            @click="onConfirm"
            :class="confirmButtonClass"
            class="px-6 py-2 rounded-sm text-white font-semibold transition transform hover:scale-105 min-w-[80px]">
            {{ confirmText }}
          </button>
        </div>

      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  visible: Boolean,
  title: String,
  message: String,
  type: {
    type: String,
    default: null,
    validator: (value) => !value || ['warning', 'danger', 'question','success'].includes(value)
  },
  confirmText: {
    type: String,
    default: '確認'
  },
  cancelText: {
    type: String,
    default: '取消'
  }
})
const emit = defineEmits(['confirm', 'cancel'])

function onCancel() {
  emit('cancel')
}

function onConfirm() {
  emit('confirm')
}

const iconBackgroundClass = computed(() => {
  const classes = {
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    question: 'bg-blue-500',
    success: 'bg-green-500'
  }
  return classes[props.type] || 'bg-gray-500'
})

const confirmButtonClass = computed(() => {
  const classes = {
    warning: 'bg-gradient-to-r from-yellow-500 to-yellow-600',
    danger: 'bg-gradient-to-r from-[#df5b5b] to-[#b82f11]',
    question: 'bg-gradient-to-r from-blue-500 to-blue-600',
    success: 'text-[var(--color-black)] bg-gradient-to-r from-[#a9ebd4] to-[#02bc7d]'
  }
  return classes[props.type] || 'bg-gradient-to-r from-[#df5b5b] to-[#b82f11]'
})
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
