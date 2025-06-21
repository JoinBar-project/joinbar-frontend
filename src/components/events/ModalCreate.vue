<script setup>
import { useEventForm } from '@/composables/useEventForm';
import FormCreate from './FormCreate.vue';
import AlertModal from '@/components/AlertModal.vue';

const emit = defineEmits(['submit', 'eventCreated']);

const { showForm, showAlert, handleAlertAccept, handleAlertDeny, overlayClick } = useEventForm();

function handleSubmit(result) {
  if (result.success) {
    emit('eventCreated', result.newEvent);
    showForm.value = false;
  
  } else {
    console.error('建立活動失敗:', result.error);
  }
}
</script>

<template>
  <div>
    <AlertModal
      :visible="showAlert"
      @accept="handleAlertAccept"
      @deny="handleAlertDeny" 
    />
    <button
      class="btn-open-form btn-create"
      @click="showForm = true">
      建立活動
    </button>
    <transition name="popup">
      <div
        v-if="showForm"
        class="popup-overlay"
        @click="overlayClick">
        <div class="modal-content">
          <button
            class="popup-close-btn"
            @click="showAlert = true">
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
  @apply mt-[30px] rounded-[20px] border-0 text-[24px] text-center shadow-md cursor-pointer transition-colors duration-200 mx-auto block;
}
.btn-create {
  @apply px-6 py-3 text-white font-medium rounded-xl shadow-lg hover:shadow-xl hover:bg-[#a83c51] transform hover:scale-105 transition-all duration-300 ease-in-out;
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
</style>