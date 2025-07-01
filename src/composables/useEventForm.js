import { ref, watch, computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useEventStore } from '@/stores/event'
import axios from 'axios'

export function useEventForm(eventId = null) {
  const authStore = useAuthStore()
  const userRole = computed(() => authStore.user?.role || 'user')
  const isAdmin = computed(() => userRole.value === 'admin')
  const userId = authStore.user?.id || null
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

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
  
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
    // 取出前 16 字元，格式類似 "2025-06-20 10:04:17" → "2025-06-20T10:04"
    const trimmed = dtString.trim().replace(' ', 'T').slice(0, 16)
    return trimmed
  }
  
  function validateForm() {
    const basicValid =
      eventName.value &&
      barName.value &&
      eventStartDate.value &&
      eventEndDate.value &&
      eventPeople.value

    const priceValid = isAdmin.value ? eventPrice.value !== '' && !isNaN(eventPrice.value) : true

    const start = dayjs(eventStartDate.value);
    const end = dayjs(eventEndDate.value);
    const now = dayjs();

    if (!start.isValid() || !end.isValid()) {
      alert('開始或結束時間格式錯誤！');
      return false;
    }

    if (start.isAfter(end)) {
      alert('開始時間不能晚於結束時間！');
      return false;
    }

    if (start.isBefore(now)) {
      alert('開始時間不能早於現在時間！');
      return false;
    }

    return basicValid && priceValid;
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
      price: isAdmin.value ? Number(eventPrice.value) : 0,
      hostUser: userId,
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
    
    try {
      // 使用 EventStore 載入活動基本資料
      await eventStore.fetchEvent(id)
      const data = eventStore.event
      
      // 取得標籤資料，優先使用 EventStore，否則直接呼叫 API
      let tagIds = eventStore.tagIds
      if (!tagIds || tagIds === undefined) {
        const apiRes = await axios.get(`${API_BASE_URL}/api/event/${id}`)
        tagIds = apiRes.data.tags || []
      }
      
      if (data) {
        eventName.value = data.name || ''
        barName.value = data.barName || ''
        eventLocation.value = data.location || ''
        eventStartDate.value = toDatetimeLocal(data.startAt)
        eventEndDate.value = toDatetimeLocal(data.endAt)
        eventImageUrl.value = data.imageUrl || ''
        eventPrice.value = data.price || ''
        eventPeople.value = data.maxPeople || ''
        
        eventHashtags.value = tagIds || []
      }
    } catch (error) {
      console.error('載入活動失敗:', error)
    }
  }

  function createFormData(imageFile, processedHashtags = null) {
    const formData = new FormData();

    formData.append('name', eventName.value.trim());
    formData.append('barName', barName.value.trim());
    formData.append('location', eventLocation.value.trim());
    formData.append('startAt', eventStartDate.value);
    formData.append('endAt', eventEndDate.value);
    formData.append('price', isAdmin.value ? (eventPrice.value || '0') : '0');
    formData.append('maxPeople', eventPeople.value);

    if (imageFile) {
      formData.append('image', imageFile);
    }

    console.log('=== 標籤處理開始 ===');
    console.log('eventHashtags.value:', eventHashtags.value);

    if (Array.isArray(eventHashtags.value) && eventHashtags.value.length > 0) {
      const tagIds = eventHashtags.value
        .map(tag => (typeof tag === 'object' && tag !== null ? tag.id || tag.value || tag : tag))
        .filter(id => id !== undefined && id !== null && id !== '' && !isNaN(id))
        .map(id => parseInt(id));

      if (tagIds.length > 0) {
        formData.append('tagIds', tagIds.join(','));
        formData.append('tagIdsJson', JSON.stringify(tagIds));
        tagIds.forEach((id, index) => {
          formData.append('tagIdList[]', id.toString());
        });
        console.log('🔥 總共發送了', tagIds.length, '個標籤，使用 3 種格式');
      } else {
        console.log('⚠️ 沒有有效的標籤 ID');
      }
    } else {
      console.log('⚠️ 標籤陣列為空或無效');
    }
    console.log('=== 標籤處理結束 ===');

    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    const tagsToUse = processedHashtags || eventHashtags.value;
    formData.append('hashtags', JSON.stringify(tagsToUse));
    
    return formData;
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
      showAlert.value = true
    }
  }
  
  watch(
    () => eventId,
    (newId) => {
      if (newId) {
        loadEvent(newId)
      }
    },
    { immediate: true }
  )

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
    isAdmin,
    
    showForm,
    showAlert,
    
    handleCreate,
    handleUpdate,
    handleDelete,
    loadEvent,
    resetForm,
    createFormData,
    handleAlertAccept,
    handleAlertDeny,
    overlayClick
  }
}