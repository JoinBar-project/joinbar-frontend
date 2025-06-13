<script setup>
import { useEventForm } from '@/composable/useEventForm'
import FormUpdate from './FormUpdate.vue'
import AlertModal from '@/components/AlertModal.vue'

const emit = defineEmits(['update'])
const props = defineProps({
  eventId: {
    type: [String, Number],
    required: true
  }
})

const {
  showForm,
  showAlert,
  handleAlertAccept,
  handleAlertDeny,
  overlayClick
} = useEventForm()

function handleUpdate() {
  showForm.value = false
  emit('update')
}

function handleDelete() {
  showForm.value = false
  emit('update')
}
</script>

<template>
  <div>
    <AlertModal
      :visible="showAlert"
      @accept="handleAlertAccept"
      @deny="handleAlertDeny"
    />
    <div class="edit-btn-container">
      <button class="btn-open-form btn-edit" @click="showForm = true" :disabled="!props.eventId">
        編輯活動
      </button>
    </div>
    <transition name="popup">
      <div v-if="showForm" class="popup-overlay" @click="overlayClick">
        <div class="modal-content">
          <button class="popup-close-btn" @click="showAlert = true">×</button>
          <div v-if="props.eventId">
            <FormUpdate
              :event-id="props.eventId"
              @click.stop
              @update="handleUpdate"
              @cancel="showAlert = true"
              @delete="handleDelete"
            />
          </div>
          <div v-else>
            <p>請選擇要編輯的活動</p>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
@reference "tailwindcss";

.edit-btn-container {
  @apply flex justify-end;
}

.btn-open-form {
  @apply flex justify-center mt-2 w-32 py-2 text-white rounded-2xl cursor-pointer;
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