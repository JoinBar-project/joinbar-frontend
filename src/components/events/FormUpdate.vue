<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useEventForm } from '@/composables/useEventForm';
import { useEventStore } from '@/stores/event';
import Hashtag from './Hashtag.vue';
import { useRouter } from 'vue-router';
import apiClient from '@/api/axios';

import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.css';
import { Mandarin } from 'flatpickr/dist/l10n/zh.js';

const emit = defineEmits(['update', 'delete', 'cancel']);
const props = defineProps({ eventId: String });

const eventStore = useEventStore();

const {
  eventName,
  barName,
  eventLocation,
  eventStartDate,
  eventEndDate,
  eventPrice,
  eventPeople,
  eventHashtags,
  eventImageUrl,
  handleUpdate,
  handleDelete,
  loadEvent,
  isAdmin,
} = useEventForm(props.eventId);

const imageFile = ref(null);
const loading = ref(false);
const imagePreview = ref(null);
const fileInput = ref(null);

const startDateInput = ref(null);
const endDateInput = ref(null);
const startDatePicker = ref(null);
const endDatePicker = ref(null);

const initFlatpickr = async () => {
  await nextTick();
  
  // 開始日期
  if (startDateInput.value && !startDatePicker.value) {
    startDatePicker.value = flatpickr(startDateInput.value, {
      locale: Mandarin,
      dateFormat: 'Y-m-d H:i',
      enableTime: true,
      time_24hr: true,
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

// 更新 flatpickr 的值
const updateFlatpickrValues = () => {
  if (startDatePicker.value && eventStartDate.value) {
    startDatePicker.value.setDate(eventStartDate.value);
  }
  if (endDatePicker.value && eventEndDate.value) {
    endDatePicker.value.setDate(eventEndDate.value);
    // 結束日期的最小值為開始日期
    if (eventStartDate.value) {
      endDatePicker.value.set('minDate', eventStartDate.value);
    }
  }
}

onMounted(async () => {
  if (props.eventId) {
    await loadEvent(props.eventId);
    if (!imageFile.value && eventImageUrl.value) {
      imagePreview.value = eventImageUrl.value;
    }
  }
  await initFlatpickr();
  // 初始化完成後更新
  await nextTick();
  updateFlatpickrValues();
});

watch(
  () => props.eventId,
  async (newId) => {
    if (newId) {
      await loadEvent(newId);
      if (!imageFile.value && eventImageUrl.value) {
        imagePreview.value = eventImageUrl.value;
      }
      // 更新時間
      await nextTick();
      updateFlatpickrValues();
    }
  },
  { immediate: true }
);

// 監聽日期變化
watch([eventStartDate, eventEndDate], () => {
  updateFlatpickrValues();
});

async function onUpdate() {
  if (loading.value) return;

  // 基本驗證
  if (!eventName.value?.trim()) {
    alert('請填寫活動名稱！');
    return;
  }
  if (!barName.value?.trim()) {
    alert('請填寫酒吧名稱！');
    return;
  }
  if (!eventStartDate.value) {
    alert('請選擇開始日期！');
    return;
  }
  if (!eventEndDate.value) {
    alert('請選擇結束日期！');
    return;
  }
  if (!eventPeople.value) {
    alert('請填寫參加人數！');
    return;
  }

  loading.value = true;
  
  try {
    
    const formData = new FormData();
    
    // 基本資料
    formData.append('name', eventName.value.trim());
    formData.append('barName', barName.value.trim());
    formData.append('startAt', eventStartDate.value);
    formData.append('endAt', eventEndDate.value);
    formData.append('maxPeople', String(eventPeople.value));
    
    // 可選資料
    if (eventLocation.value?.trim()) {
      formData.append('location', eventLocation.value.trim());
    }

    // 價格處理
    if (isAdmin.value && eventPrice.value) {
      formData.append('price', String(eventPrice.value));
    }

    // 圖片檔案
    if (imageFile.value) {
      formData.append('image', imageFile.value);
      console.log('添加圖片檔案:', imageFile.value.name);
    }

    // 標籤處理
    if (Array.isArray(eventHashtags.value) && eventHashtags.value.length > 0) {
      const tagIds = eventHashtags.value.map(tag => {
        if (typeof tag === 'object' && tag.id) {
          return Number(tag.id);
        }
        return Number(tag);
      }).filter(id => !isNaN(id) && id > 0);
      
      if (tagIds.length > 0) {
        formData.append('tags', JSON.stringify(tagIds));
      }
    }

    // 檢查認證狀態
    const token = localStorage.getItem('access_token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // 準備請求配置
    const requestConfig = {
      timeout: 30000,
    };

    // 根據登入方式設定 headers
    if (token && user?.providerType !== 'line') {
      // Email 登入用戶使用 Bearer token
      requestConfig.headers = {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      };
    } else if (user?.providerType === 'line') {
      // LINE 登入用戶使用 cookie 認證
      requestConfig.headers = {
        'Content-Type': 'multipart/form-data'
      };
    } else {
      alert('登入已過期，請重新登入');
      return;
    }
    
    // 發送請求 
    const res = await apiClient.put(`/event/update/${props.eventId}`, formData, requestConfig);


    if (res.status >= 200 && res.status < 300) {
      alert('活動更新成功！');
      emit('update');
    } else {
      const errorMessage = res.data?.message || res.data?.error || `HTTP ${res.status} 錯誤`;
      alert(`更新失敗：${errorMessage}`);
    }

  } catch (error) {

    let errorMessage = '網路或系統錯誤，請稍後再試';
    
    if (error.response) {

      
      if (error.response.status === 401) {
        errorMessage = '登入已過期，請重新登入';
        // 對於 LINE 用戶，清除狀態但不刪除 token（因為他們沒有 token）
        if (user?.providerType === 'line') {
          localStorage.removeItem('user');
          document.cookie = 'user_info=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; sameSite=lax';
        } else {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
        }
      } else if (error.response.status === 403) {
        errorMessage = '權限不足，無法編輯此活動';
      } else if (error.response.status === 404) {
        errorMessage = '活動不存在或已被刪除';
      } else if (error.response.status === 413) {
        errorMessage = '檔案太大，請選擇較小的圖片';
      } else {
        errorMessage = error.response.data?.message || 
                      error.response.data?.error || 
                      `伺服器錯誤 (${error.response.status})`;
      }
    } else if (error.request) {
      errorMessage = '網路連線失敗，請檢查網路狀態';
    } else {
      errorMessage = `請求錯誤: ${error.message}`;
    }
    
    alert(`更新失敗: ${errorMessage}`);
  } finally {
    loading.value = false;
  }
}

const router = useRouter();

async function onDelete() {
  if (loading.value || !confirm('確定要刪除這個活動嗎？')) return;

  loading.value = true;
  
  try {
    // 檢查認證狀態
    const token = localStorage.getItem('access_token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // 檢查是否有有效的認證
    if (!token && user?.providerType !== 'line') {
      alert('登入已過期，請重新登入');
      return;
    }

    if (user?.providerType === 'line' && !user?.id) {
      alert('登入狀態異常，請重新登入');
      return;
    }

    
    const response = await apiClient.delete(`/event/delete/${props.eventId}`);
    
    if (response.status >= 200 && response.status < 300) {
      alert('活動刪除成功！');
      
      // 導航回活動列表頁面
      router.push({
        path: '/event',
        state: { message: '活動已成功刪除！' }
      });
    } else {
      throw new Error(response.data?.message || '刪除失敗');
    }
    
  } catch (error) {
    
    let errorMessage = '刪除失敗，請稍後再試';
    
    if (error.response) {
      if (error.response.status === 401) {
        errorMessage = '登入已過期，請重新登入';
        
        // 清除認證狀態
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user?.providerType === 'line') {
          localStorage.removeItem('user');
          document.cookie = 'user_info=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; sameSite=lax';
        } else {
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
        }
        
        // 導向登入頁面
        setTimeout(() => {
          router.push('/login');
        }, 2000);
        
      } else if (error.response.status === 403) {
        errorMessage = '權限不足，無法刪除此活動';
      } else if (error.response.status === 404) {
        errorMessage = '活動不存在或已被刪除';
      } else {
        errorMessage = error.response.data?.message || 
                      error.response.data?.error || 
                      `伺服器錯誤 (${error.response.status})`;
      }
    } else if (error.request) {
      errorMessage = '網路連線失敗，請檢查網路狀態';
    } else {
      errorMessage = error.message || '刪除操作失敗';
    }
    
    alert(`刪除失敗: ${errorMessage}`);
    
  } finally {
    loading.value = false;
  }
}

function handleImageSelect(event) {
  const file = event.target.files[0];
  console.log('選擇圖片:', file);
  
  if (!file) return;
  
  if (!file.type.startsWith('image/')) {
    alert('請選擇圖片檔案');
    return;
  }
  
  if (file.size > 5 * 1024 * 1024) {
    alert('圖片檔案大小不能超過 5MB');
    return;
  }
  
  imageFile.value = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreview.value = e.target.result;
    console.log('圖片預覽已更新');
  };
  reader.readAsDataURL(file);
}

function triggerFileInput() {
  fileInput.value?.click();
}

onUnmounted(() => {
  destroyFlatpickr();
})
</script>

<template>
  <section class="event-form" id="edit-event">
    <div class="form-header">編輯中</div>
    <div class="form-container">
      <!-- 除錯信息 (開發時使用，正式版本請移除) -->
      <div v-if="false" style="background: yellow; padding: 10px; margin: 10px; font-size: 12px;">
        <h4>除錯信息：</h4>
        <p>活動 ID: {{ props.eventId }}</p>
        <p>Loading: {{ loading }}</p>
        <p>是否管理員: {{ isAdmin }}</p>
        <p>Token: {{ localStorage.getItem('access_token') ? 'exists' : 'missing' }}</p>
      </div>
      
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
            <label for="event-name">活動名稱*</label>
            <input
              type="text"
              id="event-name"
              v-model="eventName"
              placeholder="請輸入活動名稱"
              required />
          </div>
          <div class="form-row">
            <label for="bar-name">酒吧名稱*</label>
            <input
              type="text"
              id="bar-name"
              v-model="barName"
              placeholder="請輸入酒吧名稱"
              required />
          </div>
          <div class="event-location">
            {{ eventLocation }}
          </div>
          <div class="form-row">
            <label for="event-start-date">開始日期*</label>
            <input
              ref="startDateInput"
              type="text"
              id="event-start-date"
              :value="eventStartDate"
              placeholder="請選擇開始日期時間"
              readonly
              required
              class="cursor-pointer" />
          </div>
          <div class="form-row">
            <label for="event-end-date">結束日期*</label>
            <input
              ref="endDateInput"
              type="text"
              id="event-end-date"
              :value="eventEndDate"
              placeholder="請選擇結束日期時間"
              readonly
              required
              class="cursor-pointer" />
          </div>
          <div class="form-row" v-if="isAdmin">
            <label for="event-price">價格</label>
            <input
              type="number"
              id="event-price"
              v-model="eventPrice"
              placeholder="請輸入價格"
              min="0" />
          </div>
          <div class="form-row">
            <label for="event-people">參加人數*</label>
            <input
              type="number"
              id="event-people"
              v-model="eventPeople"
              min="1"
              step="1"
              max="30"
              required />
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
          class="btn-delete"
          @click="onDelete"
          :disabled="loading">
          {{ loading ? '處理中...' : '刪除活動' }}
        </button>
        <button
          type="button"
          class="btn-cancle"
          @click="() => emit('cancel')"
          :disabled="loading">
          取消修改
        </button>
        <button
          type="button"
          class="btn-confirm"
          @click="onUpdate"
          :disabled="loading">
          {{ loading ? '更新中...' : '完成發佈' }}
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
  background-color: var(--color-black);
}

.form-container {
  @apply mx-auto w-[700px] rounded-xl bg-gray-200;
}

.form-image-upload {
  @apply flex justify-center items-center w-full h-72 text-xl text-gray-400 bg-gray-200 cursor-pointer
         hover:bg-gray-300 transition-colors duration-200;
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
  @apply text-base text-center font-medium;
}

.form-row input {
  @apply h-9 px-4 text-base border-2 border-gray-300 rounded-lg bg-white 
         focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none
         transition-all duration-200 ease-in-out
         placeholder:text-gray-400;
}

.form-row input:required {
  @apply border-red-300;
}

.form-row input:required:valid {
  @apply border-green-300;
}

.event-location {
  @apply text-base ml-28 font-medium;
  color: var(--color-primary-red);
}

.form-bottom {
  @apply px-12 grid grid-cols-3 pb-5 gap-4;
}

.form-bottom button {
  @apply block mx-auto w-44 py-2 text-lg rounded-xl cursor-pointer font-medium
         transition-all duration-200 ease-in-out;
}

.form-bottom button:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.btn-delete {
  @apply border-2 border-gray-500 text-gray-700 
         hover:bg-gray-600 hover:text-white hover:border-gray-600;
}

.btn-cancle {
  @apply border-2 text-green-600;
  border-color: var(--color-secondary-green);
  color: var(--color-secondary-green);
}

.btn-cancle:hover:not(:disabled) {
  background-color: var(--color-secondary-green);
  color: white;
}

.btn-confirm {
  @apply text-white;
  background-color: var(--color-primary-orange);
}

.btn-confirm:hover:not(:disabled) {
  background-color: var(--color-primary-red);
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