<script setup>
import { useEventForm } from '@/composable/useEventForm'
import FormCreate from './FormCreate.vue'
import AlertModal from '@/components/AlertModal.vue'

const {
  showForm,
  showAlert,
  openForm,
  closeForm,
  handleAlertAccept,
  handleAlertDeny,
  overlayClick
} = useEventForm()

function handleCreate() {
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
    <button class="btn-open-form btn-create" @click="openForm">
      建立活動
    </button>
    <transition name="popup">
      <div v-if="showForm" class="popup-overlay" @click="overlayClick">
        <div class="modal-content">
          <button class="popup-close-btn" @click="closeForm">×</button>
          <FormCreate @click.stop @submit="handleCreate" />
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.btn-open-form {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto;
  width: 180px;
  padding: 8px 0;
  font-size: 20px;
  color: white;
  border: none;
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