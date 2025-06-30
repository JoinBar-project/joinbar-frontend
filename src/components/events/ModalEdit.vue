<script setup>
import { computed, ref } from 'vue';
import { useEventForm } from '@/composables/useEventForm';
import FormUpdate from './FormUpdate.vue';
import { useAuthStore } from '@/stores/authStore';
import BaseAlertModal from '@/components/common/BaseAlertModal.vue';
import BaseConfirmModal from '@/components/common/BaseConfirmModal.vue';

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
const { showForm } = useEventForm();

// Modal 狀態管理
const alertModal = ref({
  visible: false,
  title: '',
  message: '',
  type: 'default'
});

const confirmModal = ref({
  visible: false,
  title: '',
  message: '',
  type: null,
  confirmAction: null
});

// Modal 控制函數
const showAlert = (title, message, type = 'default') => {
  alertModal.value = {
    visible: true,
    title,
    message,
    type
  };
};

const showConfirm = (title, message, type = null) => {
  return new Promise((resolve) => {
    confirmModal.value = {
      visible: true,
      title,
      message,
      type,
      confirmAction: resolve
    };
  });
};

const closeAlert = () => {
  alertModal.value.visible = false;
};

const closeConfirm = () => {
  confirmModal.value.visible = false;
  if (confirmModal.value.confirmAction) {
    confirmModal.value.confirmAction(false);
  }
};

const handleConfirm = () => {
  confirmModal.value.visible = false;
  if (confirmModal.value.confirmAction) {
    confirmModal.value.confirmAction(true);
  }
};

// 檢查用戶是否為活動主辦人
const isEventOwner = computed(() => {
  const currentUserId = authStore.user?.id || authStore.currentUser?.id;
  const eventHostId = props.event?.hostUser?.id || props.event?.hostUser;
  return currentUserId && eventHostId && Number(currentUserId) === Number(eventHostId);
});

// 檢查是否可以顯示編輯按鈕
const canEdit = computed(() => {
  const result = authStore.isAuthenticated && isEventOwner.value && props.eventId;
  
  // 如果用戶已登入但不是活動主辦人，顯示提示
  if (authStore.isAuthenticated && !isEventOwner.value && props.eventId) {
    console.log('用戶無編輯權限：不是活動主辦人');
  }
  
  // 如果用戶未登入，顯示提示
  if (!authStore.isAuthenticated && props.eventId) {
    console.log('用戶無編輯權限：未登入');
  }
  
  return result;
});

function handleUpdate() {
  showForm.value = false;
  emit('update');
  showAlert('更新成功', '活動已成功更新！', 'success');
}

// 處理權限檢查的點擊事件
function handleEditClick() {
  if (!authStore.isAuthenticated) {
    showAlert('需要登入', '請先登入後再編輯活動', 'warning');
    return;
  }
  
  if (!isEventOwner.value) {
    showAlert('權限不足', '只有活動主辦人才能編輯此活動', 'warning');
    return;
  }
  
  if (!props.eventId) {
    showAlert('錯誤', '無法獲取活動 ID，請重新整理頁面', 'error');
    return;
  }
  
  showForm.value = true;
}

// 處理表單關閉確認
async function handleFormClose() {
  const confirmed = await showConfirm(
    '確認關閉', 
    '您確定要關閉編輯表單嗎？\n\n未儲存的變更將會遺失。',
    'warning'
  );
  
  if (confirmed) {
    showForm.value = false;
  }
}

// 處理背景點擊
async function handleOverlayClick() {
  await handleFormClose();
}
</script>

<template>
  <div>
    <!-- Alert Modal -->
    <BaseAlertModal
      :visible="alertModal.visible"
      :title="alertModal.title"
      :message="alertModal.message"
      :type="alertModal.type"
      @close="closeAlert"
    />
    
    <!-- Confirm Modal -->
    <BaseConfirmModal
      :visible="confirmModal.visible"
      :title="confirmModal.title"
      :message="confirmModal.message"
      :type="confirmModal.type"
      @confirm="handleConfirm"
      @cancel="closeConfirm"
    />
    
    <button
      v-if="canEdit"
      class="btn-open-form btn-edit"
      @click="handleEditClick">
      編輯活動
    </button>
    
    <!-- 如果用戶已登入但無權限，顯示提示按鈕 -->
    <button
      v-else-if="authStore.isAuthenticated && props.eventId"
      class="btn-open-form btn-disabled"
      @click="handleEditClick"
      disabled>
      無編輯權限
    </button>
    
    <!-- 如果用戶未登入，顯示提示按鈕 -->
    <button
      v-else-if="!authStore.isAuthenticated && props.eventId"
      class="btn-open-form btn-login-required"
      @click="handleEditClick">
      需要登入編輯
    </button>
    
    <transition name="popup">
      <div
        v-if="showForm"
        class="popup-overlay"
        @click="handleOverlayClick">
        <div class="modal-content">
          <button
            class="popup-close-btn"
            @click="handleFormClose">
            ×
          </button>
          <div v-if="props.eventId">
            <FormUpdate
              :event-id="props.eventId"
              @click.stop
              @update="handleUpdate"
              @cancel="handleFormClose"/>
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

.btn-disabled {
  @apply px-[16px] pt-[8px] pb-[10px] text-gray-500 bg-gray-300 cursor-not-allowed;
}

.btn-login-required {
  @apply px-[16px] pt-[8px] pb-[10px] text-orange-600 bg-orange-100 hover:bg-orange-200;
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