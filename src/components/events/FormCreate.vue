<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import axios from 'axios';
import { useEventForm } from '@/composables/useEventForm';
import { useAuthStore } from '@/stores/authStore';
import { useTagStore } from '@/stores/tag';
import Hashtag from './Hashtag.vue';
import apiClient from '@/api/axios';
import BaseAlertModal from '@/components/common/BaseAlertModal.vue';

import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.css';
import { Mandarin } from 'flatpickr/dist/l10n/zh.js';

const emit = defineEmits(['submit']);

const authStore = useAuthStore();
const tagStore = useTagStore();

const isAdmin = computed(() => authStore.user?.role === 'admin');

const { 
  eventName, 
  barName, 
  eventLocation, 
  eventStartDate, 
  eventEndDate, 
  eventPrice, 
  eventPeople, 
  eventHashtags,
} = useEventForm();

const imageFile = ref(null);
const imagePreview = ref(null);
const fileInput = ref(null);

const startDateInput = ref(null);
const endDateInput = ref(null);
const startDatePicker = ref(null);
const endDatePicker = ref(null);

// Modal 狀態管理
const alertModal = ref({
  visible: false,
  title: '',
  message: '',
  type: 'default'
});

// Modal 控制函數
const showAlert = (title, message, type = 'default') => {
  alertModal.value = {
    visible: true,
    title,
    message,
    type
  };
};

const closeAlert = () => {
  alertModal.value.visible = false;
};

const initFlatpickr = async () => {
  await nextTick();
  
  // 開始日期
  if (startDateInput.value && !startDatePicker.value) {
    startDatePicker.value = flatpickr(startDateInput.value, {
      locale: Mandarin,
      dateFormat: 'Y-m-d H:i',
      enableTime: true,
      time_24hr: true,
      minDate: 'today',
      allowInput: false,
      clickOpens: true,
      minuteIncrement: 30,
      
      onChange: function(selectedDates, dateStr) {
        eventStartDate.value = dateStr;
        
        // 選定開始日期時 設定最小時間
        if (endDatePicker.value && selectedDates[0]) {
          endDatePicker.value.set('minDate', selectedDates[0]);
          
          // 結束日期早於開始日期 清掉結束日期
          if (eventEndDate.value && new Date(eventEndDate.value) <= selectedDates[0]) {
            endDatePicker.value.clear();
            eventEndDate.value = '';
          }
        }
      }
    });
  }
  
  // 結束日期
  if (endDateInput.value && !endDatePicker.value) {
    endDatePicker.value = flatpickr(endDateInput.value, {
      locale: Mandarin,
      dateFormat: 'Y-m-d H:i',
      enableTime: true,
      time_24hr: true,
      minDate: 'today',
      allowInput: false,
      clickOpens: true,
      minuteIncrement: 30,
      
      onChange: function(selectedDates, dateStr) {
        eventEndDate.value = dateStr;
      }
    });
  }
}

const destroyFlatpickr = () => {
  if (startDatePicker.value) {
    startDatePicker.value.destroy();
    startDatePicker.value = null;
  }
  if (endDatePicker.value) {
    endDatePicker.value.destroy();
    endDatePicker.value = null;
  }
}

function handleImageSelect(event) {
  const file = event.target.files[0];
  if (file) {
    if (!file.type.startsWith('image/')) {
      showAlert('檔案類型錯誤', '請選擇圖片檔案', 'error');
      return;
    }
    
    if (file.size > 1 * 1024 * 1024) {
      showAlert('檔案過大', '圖片檔案大小不能超過 1MB', 'warning');
      return;
    }
    
    imageFile.value = file;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.value = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}

function triggerFileInput() {
  fileInput.value?.click();
}

async function onSubmit() {
  // 檢查登入狀態
  if (!authStore.isAuthenticated) {
    showAlert('需要登入', '請先登入後再建立活動', 'warning');
    return;
  }

  // 檢查必填欄位
  const missingFields = [];
  if (!eventName.value) missingFields.push('活動名稱');
  if (!barName.value) missingFields.push('酒吧名稱');
  if (!eventStartDate.value) missingFields.push('開始日期');
  if (!eventEndDate.value) missingFields.push('結束日期');
  if (!eventPeople.value) missingFields.push('參加人數');

  if (missingFields.length > 0) {
    showAlert('欄位未完整', `請完整填寫以下欄位：${missingFields.join('、')}`, 'warning');
    return;
  }

  // 檢查管理員價格
  if (isAdmin.value && (!eventPrice.value || isNaN(eventPrice.value))) {
    showAlert('價格錯誤', '請輸入有效的價格！', 'warning');
    return;
  }

  // 檢查日期邏輯
  const startDate = new Date(eventStartDate.value);
  const endDate = new Date(eventEndDate.value);
  
  if (startDate >= endDate) {
    showAlert('日期錯誤', '結束日期必須晚於開始日期', 'warning');
    return;
  }

  // 檢查人數限制
  const peopleCount = parseInt(eventPeople.value);
  if (peopleCount < 1 || peopleCount > 30) {
    showAlert('人數限制', '參加人數必須在 1 到 30 人之間', 'warning');
    return;
  }

  try {
    const formData = new FormData();
    
    const isValidTagFormat = Array.isArray(eventHashtags.value) && 
      eventHashtags.value.every(tag => typeof tag === 'number');
    
    if (!isValidTagFormat) {
      console.error('標籤格式錯誤，期望數字陣列，實際:', eventHashtags.value);
    }

    formData.append('name', eventName.value);
    formData.append('barName', barName.value);
    formData.append('location', eventLocation.value);
    formData.append('startAt', eventStartDate.value);
    formData.append('endAt', eventEndDate.value);
    formData.append('maxPeople', eventPeople.value);
    
    if (isAdmin.value && eventPrice.value) {
      formData.append('price', eventPrice.value);
    }
    
    if (imageFile.value) {
      formData.append('image', imageFile.value);
    }
    
    formData.append('tags', JSON.stringify(eventHashtags.value));

    const response = await apiClient.post('/event/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    // 清空表單
    eventName.value = '';
    barName.value = '';
    eventLocation.value = '';
    eventStartDate.value = '';
    eventEndDate.value = '';
    eventPrice.value = '';
    eventPeople.value = '';
    eventHashtags.value = [];
    
    // 清空日期
    if (startDatePicker.value) startDatePicker.value.clear();
    if (endDatePicker.value) endDatePicker.value.clear();
    
    if (imageFile.value) imageFile.value = null;
    if (imagePreview.value) imagePreview.value = null;
    
    showAlert('建立成功', '活動建立成功！', 'success');
    
    emit('submit', {
      success: true,
      newEvent: response.data.event || response.data
    });
    
  } catch (error) {
    console.error('=== 建立失敗 ===');
    console.error('完整錯誤:', error);
    
    let errorMessage = '發生未知錯誤';
    let alertType = 'error';
    
    if (error.response) {
      console.error('伺服器錯誤詳情:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
      
      const status = error.response.status;
      const responseData = error.response.data;
      
      switch (status) {
        case 400:
          errorMessage = responseData?.message || '請求資料格式錯誤，請檢查所有欄位';
          alertType = 'warning';
          break;
        case 401:
          errorMessage = '登入已過期，請重新登入';
          alertType = 'warning';
          break;
        case 403:
          errorMessage = '權限不足，無法建立活動';
          alertType = 'warning';
          break;
        case 413:
          errorMessage = '上傳的圖片檔案過大，請選擇較小的圖片';
          alertType = 'warning';
          break;
        case 422:
          errorMessage = responseData?.message || '資料驗證失敗，請檢查輸入內容';
          alertType = 'warning';
          break;
        case 500:
          errorMessage = '伺服器內部錯誤，請稍後再試';
          alertType = 'error';
          break;
        default:
          errorMessage = responseData?.message || `伺服器錯誤 (${status})`;
          alertType = 'error';
      }
    } else if (error.request) {
      console.error('網路錯誤:', error.request);
      errorMessage = '網路連線錯誤，請檢查網路狀態';
      alertType = 'error';
    } else {
      console.error('其他錯誤:', error.message);
      errorMessage = error.message;
      alertType = 'error';
    }
    
    showAlert('建立失敗', errorMessage, alertType);
    
    emit('submit', {
      success: false,
      error: errorMessage
    });
  }
}

onMounted(async () => {
  await initFlatpickr();
})

onUnmounted(() => {
  destroyFlatpickr();
})
</script>

<template>
  <!-- Alert Modal -->
  <BaseAlertModal
    :visible="alertModal.visible"
    :title="alertModal.title"
    :message="alertModal.message"
    :type="alertModal.type"
    @close="closeAlert"
  />

  <section class="event-form" id="new-event">
    <div class="form-header">建立新活動</div>
    <div class="form-container">
      <div class="form-image-upload" @click="triggerFileInput">
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          @change="handleImageSelect"
          style="display: none;"
        />
        
        <div v-if="!imagePreview" class="event-image-placeholder">
          點擊更換活動圖
        </div>
        
        <div v-else class="relative w-full h-full">
          <img
            :src="imagePreview"
            alt="活動圖片預覽"
            class="object-cover w-full h-full"
          />
          <div class="absolute inset-0 flex items-center justify-center transition-opacity opacity-0 hover:opacity-100 rounded-t-xl backdrop-blur-sm">
            <span class="text-lg font-medium text-white">點擊重新選擇</span>
          </div>
        </div>
      </div>
      
      <div class="form-layout">
        <div class="form-left">
          <div class="form-row">
            <label for="event-name">活動名稱</label>
            <input
              type="text"
              id="event-name"
              v-model="eventName"
              placeholder="請輸入活動名稱" />
          </div>
          <div class="form-row">
            <label for="bar-name">酒吧名稱</label>
            <input
              type="text"
              id="bar-name"
              v-model="barName"
              placeholder="請輸入酒吧名稱" />
          </div>
          <div class="event-location">
            {{ eventLocation }}
          </div>
          <div class="form-row">
            <label for="event-start-date">開始日期</label>
            <input
              ref="startDateInput"
              type="text"
              id="event-start-date"
              :value="eventStartDate"
              placeholder="請選擇開始日期時間"
              readonly
              class="cursor-pointer" />
          </div>
          <div class="form-row">
            <label for="event-end-date">結束日期</label>
            <input
              ref="endDateInput"
              type="text"
              id="event-end-date"
              :value="eventEndDate"
              placeholder="請選擇結束日期時間"
              readonly
              class="cursor-pointer" />
          </div>
          <div class="form-row" v-if="isAdmin">
            <label for="event-price">價格</label>
            <input
              type="number"
              id="event-price"
              v-model="eventPrice"
              placeholder="請輸入價格" />
          </div>
          <div class="form-row">
            <label for="event-people">參加人數</label>
            <input
              type="number"
              id="event-people"
              v-model="eventPeople"
              min="1"
              step="1"
              max="30" />
          </div>
          <Hashtag v-model="eventHashtags" />
        </div>
        <div class="form-right">
          <iframe 
            v-if="eventLocation"
            :src="`https://www.google.com/maps?q=${encodeURIComponent(eventLocation)}&output=embed`"
            class="w-full h-full border-0 rounded-lg">
          </iframe>
        </div>
      </div>
      
      <div class="form-bottom">
        <button
          type="button"
          class="btn-submit"
          @click="onSubmit">
          發佈
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
@reference "tailwindcss";

.event-form {
  @apply z-[99];
}

.form-header {
  @apply text-center mx-auto text-lg p-2 rounded-t-xl text-white;
  background-color: var(--color-primary-red);
}

.form-container {
  @apply mx-auto w-[700px] rounded-xl bg-gray-200;
}

.form-image-upload {
  @apply flex justify-center items-center w-full h-72 text-xl text-gray-400 bg-gray-200;
}

.form-layout {
  @apply p-5 grid grid-cols-[2fr_1fr] items-start gap-5;
}

.form-left {
  @apply text-base;
}

.form-right {
  @apply flex justify-center items-center w-full h-full rounded-xl;
  background-color: var(--color-black);
}

.form-row {
  @apply grid grid-cols-[100px_1fr] items-center my-2;
}

.form-row label {
  @apply text-base text-center;
}

.form-row input {
  @apply h-9 px-4 text-base border-2 border-gray-300 rounded-lg bg-white 
         focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none
         transition-all duration-200 ease-in-out
         placeholder:text-gray-400;
}

.event-location {
  @apply text-base ml-28;
  color: var(--color-primary-red);
}

.form-bottom {
  @apply px-12 pb-5 flex justify-center;
}

.btn-submit {
  @apply w-44 py-1 text-lg text-white rounded-xl cursor-pointer
         transition-all duration-200 ease-in-out;
  background-color: var(--color-primary-red);
}

.btn-submit:hover {
  background-color: var(--color-primary-orange);
}

:deep(.flatpickr-calendar) {
  border-radius: 12px !important;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15) !important;
  border: 1px solid #e5e7eb !important;
  font-family: inherit !important;
}

:deep(.flatpickr-day.selected) {
  background: #dc2626 !important;
  border-color: #dc2626 !important;
  color: white !important;
}

:deep(.flatpickr-day:hover:not(.selected)) {
  background: #ff8800 !important;
  border-color: #ff8800 !important;
  color: white !important;
}

:deep(.flatpickr-time input) {
  border-radius: 6px !important;
}
</style>