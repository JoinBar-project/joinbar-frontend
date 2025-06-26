<template>
  <transition name="modal-fade">
    <div
      v-if="visible"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      @click.self="onClose"
    >
      <div class="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md text-center space-y-4">
        
        <slot name="icon">
          <img src="/checkmark.png" class="w-12 h-12 mx-auto" alt="成功 icon" />
        </slot>

        <h2 class="text-xl font-semibold text-gray-800">{{ title }}</h2>
        <p class="text-gray-600 text-sm leading-relaxed">{{ message }}</p>

        <button
          @click="onClose"
          class="mt-4 px-6 py-2 rounded-sm text-[var(--color-black)] font-semibold transition transform hover:scale-105
          bg-gradient-to-r from-[#a9ebd4] to-[#02bc7d]">
          {{ confirmText }}
        </button>
      </div>
    </div>
  </transition>
</template>

<script setup>
const props = defineProps({
  visible: Boolean,
  title: String,
  message: String,
  confirmText: {
    type: String,
    default: '確認'
  }
})
const emit = defineEmits(['close'])

function onClose() {
  emit('close')
}
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>