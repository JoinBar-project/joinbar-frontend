<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import apiClient from "@/api/axios";
import { useEventForm } from "@/composables/useEventForm";
import { useAuthStore } from "@/stores/authStore";
import { useTagStore } from "@/stores/tag";
import Hashtag from "./Hashtag.vue";
import { useGoogleMaps } from "@/composables/useGoogleMaps/userIndex.js";
import debounce from "lodash/debounce";

import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.css';
import { Mandarin } from 'flatpickr/dist/l10n/zh.js';
import { useAlertModal } from "@/composables/useAlertModal";

const emit = defineEmits(["submit"]);

const authStore = useAuthStore();
const tagStore = useTagStore();
const { showAlert } = useAlertModal();

const isAdmin = computed(() => authStore.user?.role === "admin");

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

const mapContainer = ref(null);
const {
  isReady,
  loadGoogleMapsAPI,
  initMap,
  getGeocode,
  addMarker,
  clearMarkers,
  panTo,
  setZoom,
  getPlacePredictions,
  getPlaceDetails,
} = useGoogleMaps(mapContainer, {
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  onError: (msg) => showAlert('error', '地圖錯誤', msg),
});

const searchBarName = ref("");
const suggestions = ref([]);
const barAddress = ref("");
const suppressSuggestions = ref(false);

const getSuggestions = debounce(async (input) => {
  if (!input) {
    suggestions.value = [];
    return;
  }
  if (!isReady.value) return;
  suggestions.value = await getPlacePredictions(input);
}, 300);

watch(searchBarName, (val) => {
  if (suppressSuggestions.value) return;
  getSuggestions(val);
});

const selectSuggestion = async (suggestion) => {
  suppressSuggestions.value = true;
  suggestions.value = [];
  if (suggestion.place_id) {
    const detail = await getPlaceDetails(suggestion.place_id);
    if (detail && detail.geometry && detail.geometry.location) {
      barName.value = detail.name;
      eventLocation.value = detail.formatted_address || "";
      barAddress.value = detail.formatted_address || "";
      searchBarName.value = detail.name;
      const location = {
        lat: detail.geometry.location.lat(),
        lng: detail.geometry.location.lng(),
      };
      clearMarkers();
      addMarker({
        location,
        title: detail.name,
        infoContent: `<div style='font-size:14px;'><strong>${detail.name}</strong><br><span style='color:#666;'>${detail.formatted_address || ""}</span></div>`,
        isBarLike: true,
      });
      panTo(location, 14);
      setZoom(14);
    }
  } else {
    await searchBarLocation(suggestion.description);
  }
  setTimeout(() => {
    suppressSuggestions.value = false;
  }, 0);
};

const searchBarLocation = async (query) => {
  if (!query) return;
  if (!isReady.value) return;
  try {
    const location = await getGeocode(query);
    if (location) {
      clearMarkers();
      addMarker({
        location,
        title: query,
        infoContent: query,
        isBarLike: true,
      });
      panTo(location, 14);
      setZoom(14);
      barName.value = query;
      barAddress.value = query;
      eventLocation.value = query;
    }
  } catch (e) {
    clearMarkers();
    barAddress.value = "";
    eventLocation.value = "";
  }
};

onMounted(async () => {
  await loadGoogleMapsAPI();
  if (mapContainer.value) {
    await initMap();
  }
});

watch(barName, async (newName) => {
  if (!newName) {
    clearMarkers();
    return;
  }
  if (!isReady.value) return;
  try {
    const location = await getGeocode(newName);
    if (location) {
      clearMarkers();
      addMarker({
        location,
        title: newName,
        infoContent: newName,
        isBarLike: true,
      });
      panTo(location, 16);
    }
  } catch (e) {
    clearMarkers();
  }
});

function handleImageSelect(event) {
  const file = event.target.files[0];
  if (file) {
    if (!file.type.startsWith("image/")) {
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

async function onSubmit() {
  if (!authStore.isAuthenticated) {
    showAlert('warning', '尚未登入', '請先登入後再建立活動');
    return;
  }

  if (
    !eventName.value ||
    !barName.value ||
    !eventStartDate.value ||
    !eventEndDate.value ||
    !eventPeople.value
  ) {
    showAlert('warning', '資料不完整', '請完整填寫所有欄位！');
    return;
  }

  if (isAdmin.value && (!eventPrice.value || isNaN(eventPrice.value))) {
    showAlert('warning', '價格錯誤', '請輸入有效的價格！');
    return;
  }

  if (barAddress.value) {
    eventLocation.value = barAddress.value;
  }
  console.log(
    "送出地點:",
    eventLocation.value,
    barAddress.value,
    searchBarName.value
  );

  try {
    const formData = new FormData();

    const isValidTagFormat =
      Array.isArray(eventHashtags.value) &&
      eventHashtags.value.every((tag) => typeof tag === "number");

    if (!isValidTagFormat) {
      console.error("標籤格式錯誤，期望數字陣列，實際:", eventHashtags.value);
    }

    formData.append("name", eventName.value);
    formData.append("barName", barName.value);
    formData.append("location", eventLocation.value);
    formData.append("startAt", eventStartDate.value);
    formData.append("endAt", eventEndDate.value);
    formData.append("maxPeople", eventPeople.value);

    if (isAdmin.value && eventPrice.value) {
      formData.append("price", eventPrice.value);
    }

    if (imageFile.value) {
      formData.append("image", imageFile.value);
    }

    formData.append("tags", JSON.stringify(eventHashtags.value));

    const response = await apiClient.post("/event/create", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    // 清空表單
    eventName.value = "";
    barName.value = "";
    eventLocation.value = "";
    eventStartDate.value = "";
    eventEndDate.value = "";
    eventPrice.value = "";
    eventPeople.value = "";
    eventHashtags.value = [];
    
    // 清空日期
    if (startDatePicker.value) startDatePicker.value.clear();
    if (endDatePicker.value) endDatePicker.value.clear();

    if (imageFile.value) imageFile.value = null;
    if (imagePreview.value) imagePreview.value = null;

    showAlert('success', '建立成功', '活動建立成功！');

    emit("submit", {
      success: true,
      newEvent: response.data.event || response.data,
    });
  } catch (error) {
    console.error("=== 建立失敗 ===");
    console.error("完整錯誤:", error);

    let errorMessage = "發生未知錯誤";

    if (error.response) {
      console.error("伺服器錯誤詳情:", {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });
      errorMessage = error.response.data?.message || "伺服器錯誤";
      showAlert('error', '建立失敗', errorMessage);
    } else if (error.request) {
      console.error("網路錯誤:", error.request);
      errorMessage = "網路連線錯誤，請檢查網路狀態";
      showAlert('error', '網路錯誤', errorMessage);
    } else {
      console.error("其他錯誤:", error.message);
      errorMessage = error.message;
      showAlert('error', '發生錯誤', errorMessage);
    }

    emit("submit", {
      success: false,
      error: errorMessage,
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
  <section class="event-form hidden md:block" id="new-event">
    <div class="form-container">
    <div class="form-header">建立新活動</div>

      <div
        class="cursor-pointer bg-gradient-to-br from-gray-100 to-gray-300 rounded-3xl form-image-upload water-drop-upload hover:opacity-80 active:opacity-50"
        @click="triggerFileInput"
      >
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          @change="handleImageSelect"
          style="display: none"
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
          <div
            class="absolute inset-0 flex items-center justify-center transition-opacity opacity-0 rounded-t-xl backdrop-blur-sm hover:opacity-100"
          >
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
              placeholder="請輸入活動名稱"
            />
          </div>
          <div class="form-row">
            <label for="bar-name">酒吧名稱</label>
            <div style="position: relative; width: 100%">
              <input
                type="text"
                id="bar-name"
                v-model="searchBarName"
                placeholder="請輸入酒吧名稱"
                autocomplete="off"
                style="width: 100%"
              />
              <ul
                v-if="suggestions.length"
                class="suggestions-list"
                style="
                  position: absolute;
                  top: 40px;
                  left: 0;
                  right: 0;
                  z-index: 20;
                  background: white;
                  border: 1px solid #ddd;
                  border-radius: 8px;
                  max-height: 200px;
                  overflow-y: auto;
                  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                "
              >
                <li
                  v-for="(suggestion, idx) in suggestions"
                  :key="idx"
                  @click="selectSuggestion(suggestion)"
                  style="
                    padding: 10px 12px;
                    cursor: pointer;
                    border-bottom: 1px solid #f0f0f0;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                  "
                >
                  <span style="font-size: 18px">🔍</span>
                  {{ suggestion.description }}
                </li>
              </ul>
            </div>
          </div>
          <div class="event-location">
            {{ barAddress }}
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
              class="cursor-pointer"
            />
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
            />
          </div>
          <div class="form-row">
            <label for="event-people">參加人數</label>
            <input
              type="number"
              id="event-people"
              v-model="eventPeople"
              min="1"
              step="1"
              max="30"
            />
          </div>
          <Hashtag v-model="eventHashtags" />
        </div>
        <div class="form-right">
          <div
            ref="mapContainer"
            class="w-full h-full border-0 rounded-lg"
            style="min-height: 300px; background: #2d2d2d"
          ></div>
        </div>
      </div>

      <div class="form-bottom">
        <button type="button" class="btn-submit" @click="onSubmit">發佈</button>
      </div>
    </div>
  </section>

  <!-- 手機版 -->
  <section id="new-event-mobile" class="block md:hidden w-full">
    <div class="form-header">建立新活動</div>

    <div class="bg-gray-100 p-4 w-full">
      <!-- 活動圖上傳 -->
      <div
        @click="triggerFileInput"
        class="rounded-xl bg-gray-200 overflow-hidden w-full cursor-pointer"
      >
        <input ref="fileInput" type="file" accept="image/*" @change="handleImageSelect" class="hidden" />

        <template v-if="!imagePreview">
          <div class="h-40 flex flex-col items-center justify-center text-gray-500 text-sm">
            <i class="fa-solid fa-upload text-lg"></i>
            <div>點擊上傳圖片</div>
          </div>
        </template>

        <template v-else>
          <!-- ✅ 圖片：填滿 -->
          <img
            :src="imagePreview"
            alt="圖片預覽"
            class="w-full h-40 object-cover block"
          />
        </template>
      </div>

      <!-- 表單欄位 -->
      <div class="form-row">
        <label for="event-name">活動名稱</label>
        <input
          type="text"
          id="event-name"
          v-model="eventName"
          placeholder="請輸入活動名稱"
        />
      </div>

      <div class="form-row">
        <label for="bar-name">酒吧名稱</label>
        <div style="position: relative; width: 100%">
          <input
            type="text"
            id="bar-name"
            v-model="searchBarName"
            placeholder="請輸入酒吧名稱"
            autocomplete="off"
            style="width: 100%"
          />
          <ul
            v-if="suggestions.length"
            class="suggestions-list"
            style="
              position: absolute;
              top: 40px;
              left: 0;
              right: 0;
              z-index: 20;
              background: white;
              border: 1px solid #ddd;
              border-radius: 8px;
              max-height: 200px;
              overflow-y: auto;
              box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
            "
          >
            <li
              v-for="(suggestion, idx) in suggestions"
              :key="idx"
              @click="selectSuggestion(suggestion)"
              style="
                padding: 10px 12px;
                cursor: pointer;
                border-bottom: 1px solid #f0f0f0;
                display: flex;
                align-items: center;
                gap: 6px;
              "
            >
              <span style="font-size: 18px">🔍</span>
              {{ suggestion.description }}
            </li>
          </ul>
        </div>
      </div>

      <div class="event-location">{{ barAddress }}</div>

      <div class="form-row">
        <label for="event-start-date">開始日期</label>
        <input
          ref="startDateInput"
          type="text"
          id="event-start-date"
          :value="eventStartDate"
          placeholder="請選擇開始日期時間"
          readonly
          class="cursor-pointer"
        />
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
        />
      </div>

      <div class="form-row">
        <label for="event-people">參加人數</label>
        <input
          type="number"
          id="event-people"
          v-model="eventPeople"
          min="1"
          step="1"
          max="30"
        />
      </div>

      <div>
        <Hashtag v-model="eventHashtags" />
      </div>

      <!-- 地圖容器 -->
      <div class="mt-4 w-full h-52 bg-gray-300 rounded-lg overflow-hidden">
        <div ref="mapContainer" class="w-full h-full"></div>
      </div>

      <!-- 發佈按鈕 -->
      <div class="text-center mt-6">
        <button
          @click="onSubmit"
          class="w-32 py-2 text-white rounded-lg bg-[var(--color-primary-red)] hover:bg-[var(--color-primary-orange)]"
        >
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