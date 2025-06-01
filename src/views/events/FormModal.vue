<script setup>
import { ref } from 'vue'
import FormCreate from './FormCreate.vue'
import FormUpdate from './FormUpdate.vue'

const showForm = ref(false)
const formStatus = ref('create')

function openForm() {
  showForm.value = true
}

function closeForm() {
  const confirmClose = window.confirm('確定要關閉編輯視窗嗎？未儲存的內容將會遺失。')
  if (confirmClose) {
    showForm.value = false
  }
}

function overlayClick(event) {
  if (event.target === event.currentTarget) {
    closeForm()
  }
}

function handleCreate() {
  showForm.value = false
  formStatus.value = 'update'
}

function handleUpdate() {
  showForm.value = false
}

function handleDelete() {
  showForm.value = false
  formStatus.value = 'create'
}
</script>

<template>
  <div class="event-model-wrapper">

    <button @click="openForm":class="['btn-open-form', formStatus === 'update' ? 'btn-edit' : 'btn-create']">
    {{ formStatus === 'create' ? '建立活動' : '編輯活動' }}
    </button>

    <transition name="popup">

      <div v-if="showForm" class="popup-overlay" @click="overlayClick">
        <div class="modal-content">
          <button class="popup-close-btn" @click="closeForm">×</button>

          <FormCreate
            v-if="formStatus === 'create'" 
            @click.stop
            @submit="handleCreate"
          />

          <FormUpdate 
            v-if="formStatus === 'update'" 
            @click.stop
            @update="handleUpdate"
            @delete="handleDelete"
          />
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
  height: 45px;
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
