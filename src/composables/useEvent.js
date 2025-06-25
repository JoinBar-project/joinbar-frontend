import { ref, computed } from 'vue';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/zh-tw'
import { joinEventById } from '@/api/event'

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
    if( !event.value?.startAt ) return null
    return dayjs(event.value.startAt).tz(tz).diff(now.value, 'hour') > 24
  })

  const formattedEventTime = computed(() =>{
    if (!event.value) return ''
    const start = event.value?.startAt
    const end = event.value?.endAt

    if (!start || !end) return ''

    const formattedStart =  dayjs(event.value.startAt).tz(tz).format('YYYY.MM.DD HH:mm (ddd)')
    const formattedEnd =  dayjs(event.value.endAt).tz(tz).format('YYYY.MM.DD HH:mm (ddd)')
    return `${formattedStart} ~ ${formattedEnd}`
  })

  const toggleJoin = async () => {
    if (!event.value?.id) return
  
    try {
      await joinEventById(event.value.id)
      isJoin.value = true
      joinedNum.value++
    } catch (err) {
      console.warn('報名失敗:', err?.response?.data?.message || err.message)
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