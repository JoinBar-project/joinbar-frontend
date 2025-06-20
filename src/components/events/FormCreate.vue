<script setup>
import { ref } from 'vue';
import { useEventForm } from '@/composables/useEventForm';
import Hashtag from './Hashtag.vue';

const emit = defineEmits(['submit']);

const { eventName, barName, eventLocation, eventStartDate, eventEndDate, eventPrice, eventPeople, eventHashtags, handleCreate } = useEventForm();

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

function onSubmit() {
  const success = handleCreate();
  if (success) {
    emit('submit');
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
          <div class="form-row">
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