<script setup>
import { useEventForm } from '@/composables/useEventForm';
import FormUpdate from './FormUpdate.vue';
import { useAuthStore } from '@/stores/authStore';
import { useAlertModal } from '@/composables/useAlertModal';

const authStore = useAuthStore();
const emit = defineEmits(['update']);
const props = defineProps({
  eventId: {
    type: [String, Number],
    required: true,
  },
});

// 使用全域 Modal 系統
const { showAlert, showConfirm } = useAlertModal();

// 只導入需要的函數，避免命名衝突
const { showForm, overlayClick } = useEventForm();

function handleUpdate() {
  showForm.value = false;
  emit('update');
}

function handleCloseModal() {
  showConfirm(
    '確認關閉',
    '確定要關閉編輯視窗嗎？未儲存的變更將會遺失。',
    '確定關閉',
    '繼續編輯',
    () => {
      // 確認關閉
      showForm.value = false;
    },
    () => {
      // 取消關閉，繼續編輯
      console.log('繼續編輯');
    },
    'warning'
  );
}

function handleOverlayClick(event) {
  if (event.target === event.currentTarget) {
    handleCloseModal();
  }
}
</script>

<template>
  <div>
    <button
      v-if="useAuthStore().isAuthenticated"
      class="btn-open-form btn-edit"
      @click="showForm = true"
      :disabled="!props.eventId">
      編輯活動
    </button>
    
    <transition name="popup">
      <div
        v-if="showForm"
        class="popup-overlay"
        @click="handleOverlayClick">
        <div class="modal-content">
          <button
            class="popup-close-btn"
            @click="handleCloseModal">
            ×
          </button>
          <div v-if="props.eventId">
            <FormUpdate
              :event-id="props.eventId"
              @click.stop
              @update="handleUpdate"
              @cancel="handleCloseModal"/>
          </div>
          <div v-else>
            <p class="p-8 text-center text-gray-600">請選擇要編輯的活動</p>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
@reference "tailwindcss";

.btn-open-form {
  @apply mt-[30px] mr-[30px] rounded-[20px] border-0 text-[24px] text-center shadow-md cursor-pointer transition-colors duration-200;
}

.btn-edit {
  @apply px-[16px] pt-[8px] pb-[10px] text-white bg-[var(--color-secondary-green)] hover:bg-[#8b8d6c];
}

.edit-btn-container {
  @apply flex justify-end;
}

.btn-create {
  background-color: var(--color-primary-red);
}

.popup-overlay {
  @apply fixed top-0 left-0 z-[100] w-full h-full flex justify-center items-center;
  background-color: rgba(0, 0, 0, 0.6);
}

.modal-content {
  @apply relative rounded-2xl p-0 max-h-[90vh] overflow-y-auto;
}

.popup-close-btn {
  @apply absolute right-4 text-[30px] bg-transparent border-none text-white cursor-pointer z-[101] transition-colors duration-200;
}

.popup-close-btn:hover {
  @apply text-orange-600;
}

.popup-enter-active, .popup-leave-active {
  transition: opacity 0.3s ease;
}

.popup-enter-from, .popup-leave-to {
  opacity: 0;
}

.popup-enter-active .modal-content,
.popup-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.popup-enter-from .modal-content,
.popup-leave-to .modal-content {
  transform: scale(0.9) translateY(-20px);
}
</style>