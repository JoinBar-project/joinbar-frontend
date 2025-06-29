<script setup>
import { ref, computed } from 'vue';
import axios from 'axios';
import { useEventForm } from '@/composables/useEventForm';
import { useAuthStore } from '@/stores/authStore';
import { useTagStore } from '@/stores/tag';
import Hashtag from './Hashtag.vue';
import apiClient from '@/api/axios';

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

function handleImageSelect(event) {
  const file = event.target.files[0];
  if (file) {
    if (!file.type.startsWith('image/')) {
      alert('請選擇圖片檔案');
      return;
    }
    
    if (file.size > 1 * 1024 * 1024) {
      alert('圖片檔案大小不能超過 1MB');
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
  if (!authStore.isAuthenticated) {
    alert('請先登入後再建立活動');
    return;
  }

  if (!eventName.value || !barName.value || !eventStartDate.value || !eventEndDate.value || !eventPeople.value) {
    alert('請完整填寫所有欄位！');
    return;
  }

  if (isAdmin.value && (!eventPrice.value || isNaN(eventPrice.value))) {
    alert('請輸入有效的價格！');
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
    
    eventName.value = '';
    barName.value = '';
    eventLocation.value = '';
    eventStartDate.value = '';
    eventEndDate.value = '';
    eventPrice.value = '';
    eventPeople.value = '';
    eventHashtags.value = [];
    
    if (imageFile.value) imageFile.value = null;
    if (imagePreview.value) imagePreview.value = null;
    
    alert('活動建立成功！');
    
    emit('submit', {
      success: true,
      newEvent: response.data.event || response.data
    });
    
  } catch (error) {
    console.error('=== 建立失敗 ===');
    console.error('完整錯誤:', error);
    
    let errorMessage = '發生未知錯誤';
    
    if (error.response) {
      console.error('伺服器錯誤詳情:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      });
      errorMessage = error.response.data?.message || '伺服器錯誤';
      alert(`建立失敗: ${errorMessage}`);
    } else if (error.request) {
      console.error('網路錯誤:', error.request);
      errorMessage = '網路連線錯誤，請檢查網路狀態';
      alert(errorMessage);
    } else {
      console.error('其他錯誤:', error.message);
      errorMessage = error.message;
      alert(`發生錯誤: ${errorMessage}`);
    }
    
    emit('submit', {
      success: false,
      error: errorMessage
    });
  }
}
</script>

<template>
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
</style>