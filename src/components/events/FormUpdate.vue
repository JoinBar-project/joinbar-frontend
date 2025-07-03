<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useEventForm } from '@/composables/useEventForm';
import { useEventStore } from '@/stores/event';
import Hashtag from './Hashtag.vue';
import { useRouter } from 'vue-router';

import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.css';
import { Mandarin } from 'flatpickr/dist/l10n/zh.js';
import { useAlertModal } from '@/composables/useAlertModal';

const emit = defineEmits(['update', 'delete', 'cancel']);
const props = defineProps({ eventId: String });

const eventStore = useEventStore();
const router = useRouter();
const { showAlert, showConfirm } = useAlertModal();

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
  const missingFields = [];
  if (!eventName.value?.trim()) missingFields.push('活動名稱');
  if (!barName.value?.trim()) missingFields.push('酒吧名稱');
  if (!eventStartDate.value) missingFields.push('開始日期');
  if (!eventEndDate.value) missingFields.push('結束日期');
  if (!eventPeople.value) missingFields.push('參加人數');

  if (missingFields.length > 0) {
    showAlert('warning', '欄位未完整', `請完整填寫以下欄位：${missingFields.join('、')}`);
    return;
  }

  // 檢查日期邏輯
  const startDate = new Date(eventStartDate.value);
  const endDate = new Date(eventEndDate.value);
  
  if (startDate >= endDate) {
    showAlert('warning', '日期錯誤', '結束日期必須晚於開始日期');
    return;
  }

  // 檢查人數限制
  const peopleCount = parseInt(eventPeople.value);
  if (peopleCount < 1 || peopleCount > 30) {
    showAlert('warning', '人數限制', '參加人數必須在 1 到 30 人之間');
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

    // 使用 EventStore 的 updateEvent 方法
    const result = await eventStore.updateEvent(props.eventId, formData);

    if (result && result.success) {
      showAlert('success', '更新成功', '活動更新成功！');
      emit('update');
    } else {
      showAlert('error', '更新失敗', result?.message || '更新失敗');
    }

  } catch (error) {
    console.error('[活動更新失敗]', error);
    showAlert('error', '網路錯誤', '網路或系統錯誤，請稍後再試');
  } finally {
    loading.value = false;
  }
}

async function onDelete() {
  if (loading.value) return;

  showConfirm(
    '確認刪除',
    '確定要刪除這個活動嗎？此操作無法復原。',
    '刪除',
    '取消',
    async () => {
      loading.value = true;
      try {
        await eventStore.deleteEvent(props.eventId);
        showAlert('success', '刪除成功', '活動已成功刪除！', '確定', () => {
          router.push('/event');
        });
      } catch (error) {
        const errorMessage = eventStore.error || error?.message || '刪除失敗，請稍後再試';
        showAlert('error', '刪除失敗', errorMessage);
      } finally {
        loading.value = false;
      }
    },
    () => {
      // 取消刪除
      console.log('取消刪除');
    },
    'danger'
  );
}

function handleImageSelect(event) {
  const file = event.target.files[0];
  if (file) {
    if (!file.type.startsWith('image/')) {
      showAlert('warning', '檔案格式錯誤', '請選擇圖片檔案');
      return;
    }
    
    if (file.size > 1 * 1024 * 1024) {
      showAlert('warning', '檔案過大', '圖片檔案大小不能超過 1MB');
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

onUnmounted(() => {
  destroyFlatpickr();
});
</script>

<template>
  <section class="event-form" id="edit-event">
    <div class="form-header">編輯中</div>
    <div class="form-container">
      <div class="cursor-pointer form-image-upload rounded-3xl bg-gradient-to-br from-gray-100 to-gray-300 water-drop-upload hover:opacity-80 active:opacity-50" @click="triggerFileInput">
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          @change="handleImageSelect"
          style="display: none;"
        />
        
        <div v-if="!imagePreview" class="event-image-placeholder">
          <i class="fa-solid fa-upload"></i>
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
              class="cursor-pointer"
            />
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
              class="cursor-pointer"
            />
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
  @apply flex justify-center items-center w-full h-72 text-xl text-gray-400;
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
         focus:ring-2 focus:outline-none
         transition-all duration-200 ease-in-out
         placeholder:text-gray-400;
}

.form-row input:focus {
  border-color: var(--color-primary-orange);
  ring-color: var(--color-primary-orange);
  box-shadow: 0 0 0 2px rgba(255, 136, 0, 0.2);
}

.form-row input:required {
  @apply border-red-300;
}

.form-row input:required:valid {
  border-color: var(--color-primary-orange);
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
  background: #e1ac67 !important;
  border-color: #e1ac67 !important;
  color: white !important;
}

:deep(.flatpickr-day:hover:not(.selected)) {
  background: #e1ac67 !important;
  border-color: #e1ac67 !important;
  color: white !important;
}

:deep(.flatpickr-months .flatpickr-month) {
  background: #e1ac67 !important;
  color: white !important;
}

:deep(.flatpickr-current-month .flatpickr-monthDropdown-months) {
  background: #e1ac67 !important;
  color: white !important;
}

:deep(.flatpickr-current-month .numInputWrapper input) {
  color: white !important;
}

:deep(.flatpickr-weekdays) {
  background: var(--color-primary-orange) !important;
}

:deep(.flatpickr-weekday) {
  background: var(--color-primary-orange) !important;
  color: white !important;
}

:deep(.flatpickr-time input) {
  border-radius: 6px !important;
  border: 1px solid #e5e7eb !important;
}

:deep(.flatpickr-time input:focus) {
  border-color: var(--color-primary-orange) !important;
  box-shadow: 0 0 0 2px rgba(255, 136, 0, 0.2) !important;
}

:deep(.flatpickr-confirm) {
  background: var(--color-primary-orange) !important;
  border-color: var(--color-primary-orange) !important;
}

:deep(.flatpickr-time input) {
  border-radius: 6px !important;
}
</style>