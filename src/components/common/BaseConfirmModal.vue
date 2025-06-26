<template>
  <transition name="modal-fade">
    <div v-if="visible" class="fixed inset-0 bg-[var(--color-black)] flex items-center justify-center z-50" @click.self="onCancel">
      <div class="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md space-y-4">
        <h2 class="text-lg font-bold text-gray-900">{{ title }}</h2>
        <p class="text-gray-700 text-sm">{{ message }}</p>
        <div class="flex justify-center gap-4 pt-2">
          <button
            @click="onCancel"
            class="px-4 py-2 rounded-sm border border-gray-300 text-gray-700 hover:bg-gray-100 hover:scale-105 transition">
            取消
          </button>
          <button
            @click="onConfirm"
            class="px-4 py-2 rounded-sm text-white font-semibold transition transform bg-gradient-to-r from-[#df5b5b] to-[#b82f11] hover:scale-105">
            {{ confirmText }}
          </button>
        </div>
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
const emit = defineEmits(['confirm', 'cancel'])

function onCancel() {
  emit('cancel')
}

function onConfirm() {
  emit('confirm')
}
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
