import { ref } from 'vue';

export const useSuccessAlert = () => {
  const showAlert = ref(false);

  const triggerAlert = (duration = 1500) => {
    showAlert.value = true;
    setTimeout(() => {
      showAlert.value = false;
    }, duration);
  };

  return {
    showAlert,
    triggerAlert,
  };
};
