import { ref, watch, onMounted } from 'vue'
import { useEventStore } from '@/stores/event'

export function useEventForm(eventId = null) {
  const eventStore = useEventStore()
  
  const eventName = ref('')
  const barName = ref('')
  const eventLocation = ref('')
  const eventStartDate = ref('')
  const eventEndDate = ref('')
  const eventImageUrl = ref('')
  const eventPrice = ref('')
  const eventPeople = ref('')
  const eventHashtags = ref([])
  
  const showForm = ref(false)
  const showAlert = ref(false)
  
  // 等加入地圖元件：暫時自動填寫地點
  watch(barName, (newVal) => {
    if (newVal) {
      eventLocation.value = '台北市中正區中正路100號'
    } else {
      eventLocation.value = ''
    }
  })
  
  function toDatetimeLocal(dtString) {
    if (!dtString) return ''
    const d = new Date(dtString)
    const pad = n => n.toString().padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
  
  function validateForm() {
    return eventName.value &&
           barName.value &&
           eventStartDate.value &&
           eventEndDate.value &&
           eventPrice.value &&
           eventPeople.value
  }
  
  function createPayload() {
    return {
      name: eventName.value,
      barName: barName.value,
      location: eventLocation.value,
      startDate: eventStartDate.value,
      endDate: eventEndDate.value,
      maxPeople: Number(eventPeople.value),
      imageUrl: eventImageUrl.value,
      price: Number(eventPrice.value),
      hostUser: 1, // 暫時寫死測試帳號，等會員系統建置完成
      tags: [...eventHashtags.value]
    }
  }
  
  function resetForm() {
    eventName.value = ''
    barName.value = ''
    eventLocation.value = ''
    eventStartDate.value = ''
    eventEndDate.value = ''
    eventImageUrl.value = ''
    eventPrice.value = ''
    eventPeople.value = ''
    eventHashtags.value = []
  }
  
  async function loadEvent(id) {
    if (!id) return
    
    await eventStore.fetchEvent(id)
    const data = eventStore.event
    
    if (data && data.stringModel) {
      eventName.value = data.stringModel.name || ''
      barName.value = data.stringModel.barName || ''
      eventLocation.value = data.stringModel.location || ''
      eventStartDate.value = toDatetimeLocal(data.stringModel.startDate)
      eventEndDate.value = toDatetimeLocal(data.stringModel.endDate)
      eventImageUrl.value = data.stringModel.imageUrl || ''
      eventPrice.value = data.stringModel.price || ''
      eventPeople.value = data.stringModel.maxPeople || ''
      eventHashtags.value = data.tagIds || []
    }
  }
  
  function handleCreate() {
    if (!validateForm()) {
      alert('請完整填寫所有欄位！')
      return false
    }
    
    const payload = createPayload()
    eventStore.createEvent(payload)
    return true
  }
  
  async function handleUpdate(id) {
    if (!validateForm()) {
      alert('請完整填寫所有欄位！')
      return false
    }
    
    const payload = createPayload()
    await eventStore.updateEvent(id, payload)
    return true
  }
  
  async function handleDelete(id) {
    await eventStore.deleteEvent(id)
  }
  
  function openForm() {
    showForm.value = true
  }
  
  function closeForm() {
    showAlert.value = true
  }
  
  function handleAlertAccept() {
    showForm.value = false
    showAlert.value = false
    resetForm()
  }
  
  function handleAlertDeny() {
    showAlert.value = false
  }
  
  function overlayClick(event) {
    if (event.target === event.currentTarget) {
      closeForm()
    }
  }
  
  if (eventId) {
    onMounted(() => {
      loadEvent(eventId)
    })
  }
  
  return {
    eventName,
    barName,
    eventLocation,
    eventStartDate,
    eventEndDate,
    eventImageUrl,
    eventPrice,
    eventPeople,
    eventHashtags,
    
    showForm,
    showAlert,
    
    handleCreate,
    handleUpdate,
    handleDelete,
    loadEvent,
    resetForm,
    openForm,
    closeForm,
    handleAlertAccept,
    handleAlertDeny,
    overlayClick
  }
}