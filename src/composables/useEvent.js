import { ref, computed } from 'vue';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/zh-tw'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale('zh-tw')

const tz = 'Asia/Taipei'
const joinedNum = ref(0)

export function useEvent(event){
  
  const isJoin = ref(false)
  const showModal = ref(false)
  const now = ref(dayjs())

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
    isJoin.value = !isJoin.value

    if( isJoin.value == true){
      joinedNum.value++
    }else{
      joinedNum.value--
    }
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

  return{
    isJoin,
    joinedNum,
    toggleJoin,
    isOver24hr,
    formattedEventTime,
    showModal,
    openCancelModal,
    closeModal,
    handleConfirmCancel

  }
}