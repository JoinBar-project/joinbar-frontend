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
  openForm,
  closeForm,
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
      <button class="btn-open-form btn-edit" @click="openForm" :disabled="!props.eventId">
        編輯活動
      </button>
    </div>
    <transition name="popup">
      <div v-if="showForm" class="popup-overlay" @click="overlayClick">
        <div class="modal-content">
          <button class="popup-close-btn" @click="closeForm">×</button>
          <div v-if="props.eventId">
            <FormUpdate
              :event-id="props.eventId"
              @click.stop
              @update="handleUpdate"
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
.edit-btn-container {
  display: flex;
  justify-content: flex-end;
}

.btn-open-form {
  display: flex;
  justify-content: center;
  margin-top:10px;
  width: 120px;
  padding: 8px 0;
  color: white;
  border-radius: 20px;
  cursor: pointer;
}

.btn-create {
  background-color: var(--color-primary-red);
}

.btn-edit {
  background-color: var(--color-primary-orange);
}

.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  position: relative;
  border-radius: 20px;
  padding: 0;
  max-height: 90vh;
  overflow-y: auto;
}

.popup-close-btn {
  position: absolute;
  top: 50px;
  right: 15px;
  font-size: 30px;
  background: none;
  border: none;
  color: #000000;
  cursor: pointer;
  z-index: 101;
  transition: color 0.2s;
}

.popup-close-btn:hover {
  color: #d4624e;
}
</style>