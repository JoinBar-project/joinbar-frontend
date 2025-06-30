<script setup>
import { computed } from 'vue';
import { useEventForm } from '@/composables/useEventForm';
import FormUpdate from './FormUpdate.vue';
import AlertModal from '@/components/AlertModal.vue';
import { useAuthStore } from '@/stores/authStore';

const emit = defineEmits(['update']);
const props = defineProps({
  eventId: {
    type: [String, Number],
    required: true,
  },
  // 接收活動資料以檢查權限
  event: {
    type: Object,
    default: () => ({})
  }
});

const authStore = useAuthStore();
const { showForm, showAlert, handleAlertAccept, handleAlertDeny, overlayClick } = useEventForm();

// 檢查用戶是否為活動主辦人
const isEventOwner = computed(() => {
  const currentUserId = authStore.user?.id || authStore.currentUser?.id;
  const eventHostId = props.event?.hostUser?.id || props.event?.hostUser;
  return currentUserId && eventHostId && Number(currentUserId) === Number(eventHostId);
});

// 檢查是否可以顯示編輯按鈕
const canEdit = computed(() => {
  const result = authStore.isAuthenticated && isEventOwner.value && props.eventId;
  return result;
});

function handleUpdate() {
  showForm.value = false;
  emit('update');
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
      v-if="canEdit"
      class="btn-open-form btn-edit"
      @click="showForm = true">
      編輯活動
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
          <div v-if="props.eventId">
            <FormUpdate
              :event-id="props.eventId"
              @click.stop
              @update="handleUpdate"
              @cancel="showAlert = true"/>
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

.btn-open-form {
  @apply mt-[30px] mr-[30px] rounded-[20px] border-0 text-[24px] text-center shadow-md cursor-pointer transition-colors duration-200;
}

.btn-edit  {
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
</style>