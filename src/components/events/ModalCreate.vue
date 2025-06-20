<script setup>
import { useEventForm } from '@/composables/useEventForm';
import FormCreate from './FormCreate.vue';
import AlertModal from '@/components/AlertModal.vue';

const { showForm, showAlert, handleAlertAccept, handleAlertDeny, overlayClick } = useEventForm();
</script>

<template>
  <div>
    <AlertModal
      :visible="showAlert"
      @accept="handleAlertAccept"
      @deny="handleAlertDeny" />
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
            @submit="showForm = false" />
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
@reference "tailwindcss";

.btn-open-form {
  @apply flex justify-center items-center mx-auto w-44 py-2 text-xl text-white border-none rounded-2xl cursor-pointer;
}

.btn-create {
  background-color: var(--color-primary-red);
}

.btn-edit {
  background-color: var(--color-primary-orange);
}

.popup-overlay {
  @apply fixed top-0 left-0 z-[100] w-full h-full flex justify-center items-center;
  background-color: rgba(0, 0, 0, 0.6);
}

.modal-content {
  @apply relative rounded-2xl p-0 max-h-[90vh] overflow-y-auto;
}

.popup-close-btn {
  @apply absolute top-12 right-4 text-[30px] bg-transparent border-none text-black cursor-pointer z-[101] transition-colors duration-200;
}

.popup-close-btn:hover {
  @apply text-orange-600;
}
</style>
