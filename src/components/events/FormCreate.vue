<script setup>
import { useEventForm } from '@/composable/useEventForm'
import Hashtag from './Hashtag.vue'

const emit = defineEmits(['submit'])

const {
  eventName,
  barName,
  eventLocation,
  eventStartDate,
  eventEndDate,
  eventPrice,
  eventPeople,
  eventHashtags,
  handleCreate
} = useEventForm()

function onSubmit() {
  const success = handleCreate()
  if (success) {
    emit('submit')
  }
}
</script>

<template>
  <section class="event-form" id="new-event">
    
    <div class="form-header">建立新活動</div>
    <div class="form-container">
      <div class="form-image-upload">
        <div class="event-image-placeholder">點擊更換活動圖</div>
      </div>
      <div class="form-layout">
        <div class="form-left">
          <div class="form-row">
            <label for="event-name">活動名稱</label>
            <input type="text" id="event-name" v-model="eventName" placeholder="請輸入活動名稱" />
          </div>
          <div class="form-row">
            <label for="bar-name">酒吧名稱</label>
            <input type="text" id="bar-name" v-model="barName" placeholder="請輸入酒吧名稱" />
          </div>
          <div class="event-location">
            {{eventLocation}}
          </div>
          <div class="form-row">
            <label for="event-start-date">開始日期</label>
            <input type="datetime-local" id="event-start-date" v-model="eventStartDate" />
          </div>
          <div class="form-row">
            <label for="event-end-date">結束日期</label>
            <input type="datetime-local" id="event-end-date" v-model="eventEndDate" />
          </div>
          <div class="form-row">
            <label for="event-price">價格</label>
            <input type="number" id="event-price" v-model="eventPrice" placeholder="請輸入價格" />
          </div>
          <div class="form-row">
            <label for="event-time">參加人數</label>
            <input type="number" id="event-people" v-model="eventPeople" min="1" step="1" max="30"/>
          </div>
          <Hashtag v-model="eventHashtags" />
        </div>
        <div class="form-right"></div>
      </div>
      <div class="form-bottom">
        <button type="button" @click="onSubmit">發佈</button>
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
  background-color: var(--color-primary-red);
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
  @apply flex justify-center items-center w-full h-full rounded-2xl bg-gray-900;
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
  @apply pb-5;
}

.form-bottom button {
  @apply block mx-auto w-44 py-1 text-xl text-white border-none rounded-xl cursor-pointer;
  background-color: var(--color-primary-red);
}
</style>