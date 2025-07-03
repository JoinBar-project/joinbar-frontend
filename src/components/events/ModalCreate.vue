<script setup>
import { useEventForm } from '@/composables/useEventForm';
import FormCreate from './FormCreate.vue';
import { useAuthStore } from '@/stores/authStore';
import { ref } from 'vue';
import { useAlertModal } from '@/composables/useAlertModal';

const emit = defineEmits(['submit', 'eventCreated', 'close']);

const { showAlert, showConfirm } = useAlertModal();
const { showForm, overlayClick } = useEventForm();
const authStore = useAuthStore();

function handleSubmit(result) {
  if (result.success) {
    emit('eventCreated', result.newEvent);
    showForm.value = false;
  } else {
    showAlert('error', '建立活動失敗', result.error || '請洽客服');
  }
}

function handleClick() {
  if (!authStore.isAuthenticated) {
    showAlert('warning', '尚未登入', '請先登入才能建立活動');
    return;
  }
  showForm.value = true;
}

function handleCloseModal() {
  showConfirm(
    '確認關閉',
    '確定要關閉建立活動視窗嗎？未儲存的資料將會遺失。',
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
      class="btn-open-form btn-create"
      @click="handleClick">
      建立活動
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
          <FormCreate
            @click.stop
            @submit="handleSubmit" />
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
@reference "tailwindcss";

.btn-open-form {
  @apply mt-[30px] rounded-[20px] border-0 md:text-[24px] text-center shadow-md cursor-pointer transition-colors duration-200 mx-auto block;
}

.btn-create {
  @apply px-4 md:px-6 py-3 text-white font-medium rounded-xl shadow-lg hover:shadow-xl hover:bg-[#a83c51] transform hover:scale-105 transition-all duration-300 ease-in-out;
  background-color: var(--color-primary-red);
}

.btn-edit {
  @apply px-[16px] pt-[8px] pb-[10px] text-white bg-[var(--color-secondary-green)] hover:bg-[#8b8d6c];
}

.edit-btn-container {
  @apply flex justify-end;
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
  @apply text-red-600;
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