import { ref, computed, watch } from 'vue';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/zh-tw';
import { useAuthStore } from '@/stores/authStore'; 

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('zh-tw');

const tz = 'Asia/Taipei';

export function useEvent(event, showAlert = () => {}) {
  const isJoin = ref(false);
  const joinedNum = ref(0);
  const showModal = ref(false);
  const now = ref(dayjs());

  watch(
    event,
    (newEvent) => {
      if (newEvent) {
        joinedNum.value = newEvent.currentParticipants || 0;
        isJoin.value = newEvent.isUserParticipated || false;

        console.log('✅ useEvent 數據同步:', {
          eventId: newEvent.id,
          joinedNum: joinedNum.value,
          isJoin: isJoin.value,
        });
      }
    },
    { immediate: true, deep: true }
  );

  const isOver24hr = computed(() => {
    if (!event.value?.startAt) return null;
    return dayjs(event.value.startAt).tz(tz).diff(now.value, 'hour') > 24;
  });

  const formattedEventTime = computed(() => {
    if (!event.value) return '';
    const start = event.value?.startAt;
    const end = event.value?.endAt;

    if (!start || !end) return '';

    const formattedStart = dayjs(start).tz(tz).format('YYYY.MM.DD HH:mm (ddd)');
    const formattedEnd = dayjs(end).tz(tz).format('YYYY.MM.DD HH:mm (ddd)');
    return `${formattedStart} ~ ${formattedEnd}`;
  });

  function toggleJoin() {
    const authStore = useAuthStore(); 
    if (!authStore.isAuthenticated) {
      showAlert('warning', '尚未登入', '請先登入才能參加活動');
      return;
    }

    if (
      event.value.maxPeople &&
      joinedNum.value >= event.value.maxPeople &&
      !isJoin.value
    ) {
      showAlert('warning', '人數已滿', '已達報名上限，無法再報名此活動');
      return;
    }

    isJoin.value = !isJoin.value;

    if (isJoin.value) {
      joinedNum.value++;
    } else {
      joinedNum.value--;
    }

    console.log('✅ toggleJoin 完成，新狀態:', {
      isJoin: isJoin.value,
      joinedNum: joinedNum.value,
    });
  }

  function openCancelModal() {
    showModal.value = true;
  }

  function closeModal() {
    showModal.value = false;
  }

  function handleConfirmCancel() {
    isJoin.value = false;
    showModal.value = false;
  }

  function updateParticipationStatus(participated, count) {
    isJoin.value = participated;
    joinedNum.value = count;

    console.log('✅ 手動更新參與狀態:', {
      isJoin: isJoin.value,
      joinedNum: joinedNum.value,
    });
  }

  return {
    isJoin,
    joinedNum,
    toggleJoin,
    isOver24hr,
    formattedEventTime,
    showModal,
    openCancelModal,
    closeModal,
    handleConfirmCancel,
    updateParticipationStatus,
  };
}