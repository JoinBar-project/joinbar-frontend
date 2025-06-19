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

const imageFile = ref(null);

watch(
  () => props.eventId,
  newId => {
    if (newId) loadEvent(newId);
  },
  { immediate: true }
);

async function onUpdate() {
  try {
    const formData = new FormData();

    formData.append('name', eventName.value);
    formData.append('bar_name', barName.value);
    formData.append('location', eventLocation.value);
    formData.append('start_at', eventStartDate.value);
    formData.append('end_at', eventEndDate.value);
    formData.append('price', eventPrice.value);
    formData.append('max_people', eventPeople.value);

    // 加入圖片（如果有）
    if (imageFile.value) {
      formData.append('image', imageFile.value);
    }

    // 加入 tagIds
    const tagIds = eventHashtags.value.map(tag => tag.id);
    tagIds.forEach(id => formData.append('tagIds', id)); // 支援多選

    const token = localStorage.getItem('token');
    console.log('token:', token)
    await axios.put(`/api/event/update/${props.eventId}`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    emit('update');
  } catch (error) {
    console.error('更新失敗:', error.response?.data || error);
  }
}

async function onDelete() {
  try {
    await handleDelete(props.eventId);
    emit('delete');
  } catch (error) {
    console.error('刪除失敗:', error);
  }
}
</script>

<template>
  <section
    class="event-form"
    id="edit-event">
    <div class="form-header">編輯中</div>
    <div class="form-container">
      <div class="form-image-upload">
        <div class="event-image-placeholder">點擊更換活動圖</div>
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
        <div class="form-right"></div>
      </div>
      <div class="form-bottom">
        <button
          type="button"
          class="btn-delete"
          @click="onDelete">
          刪除活動
        </button>
        <button
          type="button"
          class="btn-cancle"
          @click="emit('cancel')">
          取消修改
        </button>
        <button
          type="button"
          class="btn-confirm"
          @click="onUpdate">
          完成發佈
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
  @apply w-36 text-center mx-auto text-lg p-1 rounded-t-2xl text-white;
  background-color: var(--color-primary-orange);
}

.form-container {
  @apply mx-auto w-[700px] rounded-xl bg-gray-300;
}

.form-image-upload {
  @apply flex justify-center items-center w-full h-72 text-xl text-gray-400 rounded-t-xl bg-gray-200;
}

.form-layout {
  @apply p-5 grid grid-cols-[1.5fr_1fr] items-center gap-5;
}

.form-left {
  @apply text-xl;
}

.form-right {
  @apply flex justify-center items-center w-full h-full rounded-2xl;
  background-color: var(--color-black);
}

.form-row {
  @apply grid grid-cols-[100px_1fr] items-center my-2;
}

.form-row label {
  @apply text-xl text-center;
}

.form-row input {
  @apply h-10 px-2 text-lg border-[3px] border-gray-400 rounded-2xl bg-white;
}

.event-location {
  @apply text-base ml-28;
  color: var(--color-primary-red);
}

.form-bottom {
  @apply px-12 grid grid-cols-3 pb-5;
}

.form-bottom button {
  @apply block mx-auto w-44 py-1 text-xl text-white border-none rounded-xl cursor-pointer;
}

.btn-delete {
  @apply bg-gray-400;
}

.btn-cancle {
  background-color: var(--color-secondary-green);
}

.btn-confirm {
  background-color: var(--color-primary-red);
}
</style>