<script setup>
import { ref, watch } from 'vue';
import axios from 'axios';
import { useEventForm } from '@/composables/useEventForm';
import Hashtag from './Hashtag.vue';

const emit = defineEmits(['update', 'delete', 'cancel']);
const props = defineProps({ eventId: String });

const {
  eventName,
  barName,
  eventLocation,
  eventStartDate,
  eventEndDate,
  eventPrice,
  eventPeople,
  eventHashtags,
  handleUpdate,
  handleDelete,
  loadEvent,
  isAdmin,
} = useEventForm(props.eventId);

// 新增的變數
const imageFile = ref(null);
const loading = ref(false);
const imagePreview = ref(null);
const fileInput = ref(null);

watch(
  () => props.eventId,
  newId => {
    if (newId) loadEvent(newId);
  },
  { immediate: true }
);

async function onUpdate() {
  if (loading.value) return; // 防止重複點擊
  
  loading.value = true;
  try {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
      alert('登入已過期，請重新登入');
      return;
    }

    const formData = new FormData();
    formData.append('name', eventName.value || '');
    formData.append('bar_name', barName.value || '');
    formData.append('location', eventLocation.value || '');
    formData.append('start_at', eventStartDate.value || '');
    formData.append('end_at', eventEndDate.value || '');
    formData.append('price', eventPrice.value || '');
    formData.append('max_people', eventPeople.value || '');

    if (imageFile.value) {
      formData.append('image', imageFile.value);
    }

    // 檢查 eventHashtags 是否為陣列
    if (Array.isArray(eventHashtags.value)) {
      const tagIds = eventHashtags.value.map(tag => tag.id);
      tagIds.forEach(id => formData.append('tagIds', id));
    }

    console.log('準備發送請求...');
    console.log('EventId:', props.eventId);

    const response = await axios.put(`/api/event/update/${props.eventId}`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('更新成功:', response.data);
    alert('活動更新成功！');
    emit('update');
    
  } catch (error) {
    console.error('完整錯誤信息:', error);
    
    // 詳細錯誤處理
    if (error.response) {
      // 伺服器回應的錯誤
      console.error('伺服器錯誤:', error.response.status, error.response.data);
      alert(`更新失敗: ${error.response.data?.message || '伺服器錯誤'}`);
    } else if (error.request) {
      // 網路請求錯誤
      console.error('網路錯誤:', error.request);
      alert('網路連線錯誤，請檢查網路狀態');
    } else {
      // 其他錯誤
      console.error('未知錯誤:', error.message);
      alert(`發生錯誤: ${error.message}`);
    }
  } finally {
    loading.value = false;
  }
}

async function onDelete() {
  if (loading.value) return; // 防止重複點擊
  
  if (!confirm('確定要刪除這個活動嗎？')) {
    return;
  }
  
  loading.value = true;
  try {
    await handleDelete(props.eventId);
    emit('delete');
  } catch (error) {
    console.error('刪除失敗:', error);
    alert(`刪除失敗: ${error.message}`);
  } finally {
    loading.value = false;
  }
}

function handleImageSelect(event) {
  const file = event.target.files[0];
  if (file) {
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
    };
    reader.readAsDataURL(file);
  }
}

function triggerFileInput() {
  fileInput.value?.click();
}
</script>

<template>
  <section class="event-form" id="edit-event">
    <div class="form-header">編輯中</div>
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
            class="w-full h-full object-cover"
          />
          <div class="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity rounded-t-xl flex items-center justify-center backdrop-blur-sm">
            <span class="text-white text-lg font-medium">點擊重新選擇</span>
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
              type="datetime-local"
              id="event-start-date"
              v-model="eventStartDate" />
          </div>
          <div class="form-row">
            <label for="event-end-date">結束日期</label>
            <input
              type="datetime-local"
              id="event-end-date"
              v-model="eventEndDate" />
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
            class="w-full h-full rounded-lg border-0">
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
  @apply px-12 grid grid-cols-3 pb-5;
}

.form-bottom button {
  @apply block mx-auto w-44 py-1 text-lg rounded-xl cursor-pointer;
}

.form-bottom button:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.btn-delete {
  @apply border-2 border-gray-500 text-gray-700 
         hover:bg-gray-600 hover:text-white hover:border-gray-600
         transition-all duration-200 ease-in-out;
}

.btn-cancle {
  @apply border-2 text-green-600
         hover:text-white transition-all duration-200 ease-in-out;
  border-color: var(--color-secondary-green);
  color: var(--color-secondary-green);
}

.btn-cancle:hover {
  background-color: var(--color-secondary-green);
}

.btn-confirm {
  @apply text-white transition-all duration-200 ease-in-out;
  background-color: var(--color-primary-orange);
}

.btn-confirm:hover {
  background-color: var(--color-primary-red);
}
</style>