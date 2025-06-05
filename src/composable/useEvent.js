import { ref, computed } from 'vue';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-tw'
dayjs.locale('zh-tw')

export function useEvent(){
  
  const isJoin = ref(false)
  const showModal = ref(false)
  const now = ref(dayjs())

  const isOver24hr = computed(() => {
    if( !event.value || !event.value.startDate ) return false
    return dayjs(event.value.startDate).diff(now.value, 'hour') > 24
  })

  const formattedEventTime = computed(() =>{
    if (!event.value) return ''
    const start = dayjs(event.value.startDate).format('YYYY.MM.DD HH:mm (ddd)')
    const end = dayjs(event.value.endDate).format('YYYY.MM.DD HH:mm (ddd)')
    return `${start} ~ ${end}`
  })

  function toggleJoin(){
    isJoin.value = !isJoin.value
    console.log('現在狀態是：', isJoin.value)
  }

  function openCancelModal(){
    showModal.value = true
  }

  function closeModal() {
    showModal.value = false
  }

  function handleConfirmCancel(){
    isJoin.value = false
    showModal.value = false
  }

  return{
    isJoin,
    toggleJoin,
    isOver24hr,
    formattedEventTime,
    showModal,
    openCancelModal,
    closeModal,
    handleConfirmCancel

  }
}