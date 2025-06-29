import { ref, computed, watch } from 'vue';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/zh-tw'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale('zh-tw')

const tz = 'Asia/Taipei'

export function useEvent(event){
  
  const isJoin = ref(false)
  const joinedNum = ref(0)
  const showModal = ref(false)
  const now = ref(dayjs())

  watch(event, (newEvent) => {
    if (newEvent) {
      joinedNum.value = newEvent.currentParticipants || 0;
      
      isJoin.value = newEvent.isUserParticipated || false;
      
      console.log('✅ useEvent 數據同步:', {
        eventId: newEvent.id,
        joinedNum: joinedNum.value,
        isJoin: isJoin.value
      });
    }
  }, { immediate: true, deep: true });

  const isOver24hr = computed(() => {
    if( !event.value?.startDate ) return null
    return dayjs(event.value.startDate).tz(tz).diff(now.value, 'hour') > 24
  })

  const formattedEventTime = computed(() =>{
    if (!event.value) return ''
    const start = event.value?.startDate
    const end = event.value?.endDate

    if (!start || !end) return ''

    const formattedStart =  dayjs(event.value.startDate).tz(tz).format('YYYY.MM.DD HH:mm (ddd)')
    const formattedEnd =  dayjs(event.value.endDate).tz(tz).format('YYYY.MM.DD HH:mm (ddd)')
    return `${formattedStart} ~ ${formattedEnd}`
  })

  function toggleJoin(){
    console.log('🔄 toggleJoin 被調用，當前狀態:', isJoin.value);
    
    isJoin.value = !isJoin.value

    if( isJoin.value == true){
      joinedNum.value++
    }else{
      joinedNum.value--
    }
    
    console.log('✅ toggleJoin 完成，新狀態:', {
      isJoin: isJoin.value,
      joinedNum: joinedNum.value
    });
  }

  function openCancelModal(){
    showModal.value = true
  }

  function closeModal() {
    showModal.value = false
  }

  function handleConfirmCancel(){
    toggleJoin()
    showModal.value = false
  }

  function updateParticipationStatus(participated, count) {
    isJoin.value = participated;
    joinedNum.value = count;
    
    console.log('✅ 手動更新參與狀態:', {
      isJoin: isJoin.value,
      joinedNum: joinedNum.value
    });
  }

  return{
    isJoin,
    joinedNum,
    toggleJoin,
    isOver24hr,
    formattedEventTime,
    showModal,
    openCancelModal,
    closeModal,
    handleConfirmCancel,
    updateParticipationStatus 
  }
}