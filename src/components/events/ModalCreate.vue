<script setup>
import { ref } from 'vue';
import { useEventForm } from '@/composables/useEventForm';
import FormCreate from './FormCreate.vue';
import { useAuthStore } from '@/stores/authStore';
import BaseAlertModal from '@/components/common/BaseAlertModal.vue';
import BaseConfirmModal from '@/components/common/BaseConfirmModal.vue';

const emit = defineEmits(['submit', 'eventCreated']);

const { showForm } = useEventForm();
const authStore = useAuthStore();

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

function handleSubmit(result) {
  if (result.success) {
    emit('eventCreated', result.newEvent);
    showForm.value = false;
    showAlert('建立成功', '活動已成功建立！', 'success');
  } else {
    console.error('建立活動失敗:', result.error);
    
    // 根據錯誤類型顯示不同的提示
    let errorMessage = result.error || '建立活動失敗，請重試';
    let alertType = 'error';
    
    if (typeof result.error === 'string') {
      if (result.error.includes('登入已過期') || result.error.includes('認證失敗')) {
        alertType = 'warning';
      } else if (result.error.includes('權限不足') || result.error.includes('驗證失敗')) {
        alertType = 'warning';
      } else if (result.error.includes('網路連線') || result.error.includes('連線失敗')) {
        alertType = 'error';
      }
    }
    
    showAlert('建立失敗', errorMessage, alertType);
  }
}

function handleClick() {
  if (!authStore.isAuthenticated) {
    showAlert('需要登入', '請先登入才能建立活動', 'warning');
    return;
  }
  
  // 檢查用戶角色權限（如果需要）
  if (authStore.user && authStore.user.status === 'inactive') {
    showAlert('帳號未啟用', '您的帳號尚未啟用，無法建立活動', 'warning');
    return;
  }
  
  showForm.value = true;
}

// 處理表單關閉確認
async function handleFormClose() {
  const confirmed = await showConfirm(
    '確認關閉', 
    '您確定要關閉表單嗎？\n\n未儲存的資料將會遺失。',
    'warning'
  );
  
  if (confirmed) {
    showForm.value = false;
  }
}

async function handleOverlayClick(event) {
  // 檢查是否有其他 Modal 正在顯示
  const hasActiveModal = document.querySelector('.BaseAlertModal, .BaseConfirmModal, [role="dialog"]');
  
  if (hasActiveModal) {
    return; // 如果有其他 Modal 顯示，不處理背景點擊
  }
  
  if (event.target.classList.contains('popup-overlay')) {
    await handleFormClose();
  }
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
      class="btn-open-form btn-create"
      @click="handleClick">
      <i class="mr-2 fa-solid fa-plus"></i>
      建立活動
    </button>
    
    <transition name="popup">
      <div
        v-if="showForm"
        class="popup-overlay"
        @click="handleOverlayClick">
        <div class="modal-content" @click.stop>
          <button
            class="popup-close-btn"
            @click="handleFormClose">
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

.btn-create:hover {
  @apply shadow-2xl;
  transform: translateY(-2px) scale(1.05);
}

.btn-create:active {
  @apply shadow-md;
  transform: translateY(0) scale(1.02);
}

.btn-create i {
  @apply inline-block mr-2;
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
  backdrop-filter: blur(2px);
}

.modal-content {
  @apply relative rounded-2xl p-0 max-h-[90vh] overflow-y-auto;
  animation: modalSlideIn 0.3s ease-out;
}

.popup-close-btn {
  @apply absolute right-4 text-[30px] bg-transparent border-none text-white cursor-pointer z-[101] transition-colors duration-200;
}

.popup-close-btn:hover {
  @apply text-red-500;
  transform: scale(1.1);
}

/* 動畫效果 */
@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-50px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.popup-enter-active,
.popup-leave-active {
  transition: all 0.3s ease;
}

.popup-enter-from {
  opacity: 0;
}

.popup-leave-to {
  opacity: 0;
}

.popup-enter-from .modal-content,
.popup-leave-to .modal-content {
  transform: translateY(-50px) scale(0.9);
}

/* 響應式設計 */
@media (max-width: 768px) {
  .btn-create {
    @apply text-[20px] px-4 py-2;
  }
  
  .modal-content {
    @apply mx-4 max-w-[calc(100vw-2rem)];
  }
}

:deep(.BaseAlertModal),
:deep(.BaseConfirmModal) {
  z-index: 99999 !important;
}
</style>