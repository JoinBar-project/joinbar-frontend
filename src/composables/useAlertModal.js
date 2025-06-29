import { ref } from 'vue'

const alertModal = ref({
  visible: false,
  type: 'default',
  title: '',
  message: '',
  confirmText: '確認',
  onConfirm: null
})

export const useAlertModal = () => {
  const showAlert = (type, title, message, confirmText = '確認', onConfirm = null) => {
    alertModal.value = {
      visible: true,
      type,
      title,
      message,
      confirmText,
      onConfirm
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

  return {
    alertModal,
    showAlert,
    closeAlert
  }
}