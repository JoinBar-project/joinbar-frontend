import { ref } from 'vue'

const alertModal = ref({
  visible: false,
  type: 'default',
  title: '',
  message: '',
  confirmText: '確認',
  onConfirm: null
})

const confirmModal = ref({
  visible: false,
  type: 'warning',
  title: '',
  message: '',
  confirmText: '確認',
  cancelText: '取消',
  onConfirm: null,
  onCancel: null
})

export const useAlertModal = () => {
  
  const showAlert = (type, title, message, confirmText = '確認', onConfirm = null) => {
    confirmModal.value.visible = false
    
    alertModal.value = {
      visible: true,
      type,
      title,
      message,
      confirmText,
      onConfirm
    }
  }

  const showConfirm = (title, message, confirmText = '確認', cancelText = '取消', onConfirm = null, onCancel = null, type = 'warning') => {
    alertModal.value.visible = false
    
    confirmModal.value = {
      visible: true,
      type,
      title,
      message,
      confirmText,
      cancelText,
      onConfirm,
      onCancel
    }
  }

  const closeAlert = () => {
    alertModal.value.visible = false

    if (typeof alertModal.value.onConfirm === 'function') {
      setTimeout(() => {
        alertModal.value.onConfirm()
        alertModal.value.onConfirm = null
      }, 300)
    }
  }

  const handleConfirmModalConfirm = () => {
    if (typeof confirmModal.value.onConfirm === 'function') {
      confirmModal.value.onConfirm()
    }
    
    confirmModal.value.visible = false
    confirmModal.value.onConfirm = null
    confirmModal.value.onCancel = null
  }

  const handleConfirmModalCancel = () => {
    if (typeof confirmModal.value.onCancel === 'function') {
      confirmModal.value.onCancel()
    }
    
    confirmModal.value.visible = false
    confirmModal.value.onConfirm = null
    confirmModal.value.onCancel = null
  }

  return {
    alertModal,
    confirmModal,
    showAlert,
    showConfirm,
    closeAlert,
    handleConfirmModalConfirm,
    handleConfirmModalCancel
  }
}