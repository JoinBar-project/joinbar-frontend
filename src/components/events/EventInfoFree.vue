<script setup>
import { useEvent } from '@/composables/useEvent.js';
import { toRef, computed, ref, watch, onMounted } from 'vue';
import { getEventById } from '@/api/event';
import EventHoster from './EventHoster.vue';
import MessageBoard from './MessageBoard.vue';
import ModalEdit from '@/components/events/ModalEdit.vue';
import BaseConfirmModal from '@/components/common/BaseConfirmModal.vue';
import { useAlertModal } from '@/composables/useAlertModal';
import { useGoogleMaps } from "@/composables/useGoogleMaps/userIndex.js";
import { useAuthStore } from '@/stores/authStore'; 
const authStore = useAuthStore(); 

const emit = defineEmits(['update', 'close']);

const props = defineProps({
  event: Object,
  tags: Array,
  eventId: String,
  user: {
    type: Object,
    required: true,
  },
});

const { showAlert } = useAlertModal();

const eventRef = toRef(props, 'event');
const localEvent = ref({ ...props.event });
const localTags = ref([...props.tags]);
const isUpdating = ref(false);

const currentEvent = computed(() => localEvent.value || {});
const currentTags = computed(() => localTags.value || []);

const currentUserId = computed(() => {
  return authStore.user?.id || authStore.currentUser?.id || (() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user?.id ? Number(user.id) : null;
    } catch {
      return null;
    }
  })();
});

const isHostUser = computed(() => {
  const userId = currentUserId.value;
  const hostId = currentEvent.value?.hostUser?.id || currentEvent.value?.hostUser;
  return userId !== null && hostId !== null && Number(userId) === Number(hostId);
});

const mapContainer = ref(null);
const {
  map,
  isReady,
  loadGoogleMapsAPI,
  initMap,
  getGeocode,
  addMarker,
  clearMarkers,
  panTo,
  setZoom,
} = useGoogleMaps(mapContainer, {
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  onError: (msg) => console.error("Google Maps 錯誤:", msg),
  scrollwheel: false,
});

const displayEventLocation = async (location) => {
  if (!location || !isReady.value) return;
  try {
    const coordinates = await getGeocode(location);
    if (coordinates) {
      clearMarkers();
      addMarker({
        location: coordinates,
        title: currentEvent.value?.barName || "活動地點",
        infoContent: `<div style="font-size: 14px;"><strong>${currentEvent.value?.barName}</strong><br><span style="color: #666;">${location}</span></div>`,
        isBarLike: true,
      });
      panTo(coordinates, 16);
      setZoom(16);
    } else {
      const fallback = { lat: 25.033, lng: 121.5654 };
      panTo(fallback, 12);
      setZoom(12);
    }
  } catch (error) {
    const fallback = { lat: 25.033, lng: 121.5654 };
    panTo(fallback, 12);
    setZoom(12);
  }
};

onMounted(async () => {
  await loadGoogleMapsAPI();
  if (mapContainer.value) {
    await initMap();
    if (currentEvent.value?.location) {
      await displayEventLocation(currentEvent.value.location);
    }
  }
});

watch(
  () => props.event,
  (newEvent) => {
    if (newEvent && !isUpdating.value) {
      localEvent.value = { ...newEvent };
      if (newEvent.location && isReady.value) {
        displayEventLocation(newEvent.location);
      }
    }
  },
  { deep: true, immediate: true }
);

watch(
  () => props.tags,
  (newTags) => {
    if (newTags && !isUpdating.value) {
      localTags.value = [...newTags];
    }
  },
  { deep: true, immediate: true }
);

watch([isReady, () => currentEvent.value?.location], ([ready, location]) => {
  if (ready && location) displayEventLocation(location);
});

const {
  isJoin,
  joinedNum,
  toggleJoin,
  isOver24hr,
  showModal,
  formattedEventTime,
  openCancelModal,
  closeModal,
  handleConfirmCancel,
} = useEvent(eventRef, showAlert);

async function reloadEventData() {
  const eventId = props.eventId || localEvent.value?.id;
  if (!eventId) return;
  try {
    isUpdating.value = true;
    const { event: updatedEvent, tags: updatedTags } = await getEventById(eventId);
    if (updatedEvent) {
      localEvent.value = { ...updatedEvent };
      if (updatedEvent.location && isReady.value) {
        await displayEventLocation(updatedEvent.location);
      }
    }
    if (updatedTags) localTags.value = [...updatedTags];
    emit("update", { event: localEvent.value, tags: localTags.value });
  } catch (error) {
    console.error("活動資料載入失敗:", error);
  } finally {
    isUpdating.value = false;
  }
}

async function handleEventUpdate() {
  setTimeout(reloadEventData, 500);
}

const handleJoinToggle = async () => {
  try {
    await toggleJoin();
  } catch (error) {
    showAlert('warning', '尚未登入', '請先登入才能加入購物車');
  }
};

const handleCancelConfirm = async () => {
  try {
    await handleConfirmCancel();
    await reloadEventData();
  } catch (error) {
    console.error("取消報名失敗:", error);
  }
};
</script>

<template>
  <div>
    <!-- Loading 狀態 -->
    <div v-if="isUpdating" class="fixed inset-0 flex items-center justify-center bg-black/50 z-[9998]">
      <div class="flex items-center gap-4 p-6 text-lg bg-white rounded-lg shadow-md md:p-8 md:text-xl">
        <i class="pr-4 mt-3 text-orange-500 fa-solid fa-spinner fa-spin md:pr-8 min-w-6 md:min-w-8"></i>
        <span>更新中...</span>
      </div>
    </div>

    <!-- 主要內容容器 -->
    <div class="flex items-center justify-center max-w-full px-4 pt-4 md:pt-8 md:px-0">
      <div class="w-full max-w-7xl md:min-w-[1170px] bg-gray-100 pb-8 mx-auto relative rounded-xl md:rounded-2xl overflow-hidden">
        <!-- 活動圖片 -->
        <div>
          <img :src="currentEvent.imageUrl" alt="活動圖片" class="w-full aspect-[2/1] md:aspect-[3.5/1] object-cover"/>
        </div>
        
        <div class="relative event-content-box">
          <!-- 桌面版地圖 - 左側浮動 -->
          <div class="hidden md:block absolute bottom-16 left-20 z-10 bg-gray-500 rounded-lg max-w-[325px] w-[325px] h-[520px] shadow-md">
            <div
              ref="mapContainer"
              class="w-full h-full bg-gray-800 border-0 rounded-lg"
              style="min-height: 300px;"
            ></div>
          </div>
          
          <!-- 內容區域 -->
          <div class="pt-5 px-5 pb-10 md:pt-5 md:pr-16 md:pb-10 md:pl-[500px]">
            <!-- 標籤 -->
            <div class="flex flex-wrap gap-2 mt-3 md:gap-3">
              <div 
                v-for="tag in currentTags" 
                :key="tag.id" 
                class="px-4 py-2 text-sm text-center text-white bg-black rounded-full md:px-5 whitespace-nowrap md:text-base"
              >
                {{ tag.name }}
              </div>
            </div>

            <!-- 活動標題 -->
            <h3 class="mt-5 mb-5 text-xl font-bold md:text-3xl">{{ currentEvent.name }}</h3>

            <!-- 活動資訊 -->
            <div v-if="formattedEventTime" class="flex items-start py-1">
              <i class="pr-4 mt-3 text-sm fa-solid fa-calendar md:pr-7 min-w-6 md:min-w-8 md:text-base"></i>
              <p class="m-0 text-base leading-8 md:text-xl">活動時間：{{ formattedEventTime }}</p>
            </div>

            <div class="flex items-start py-1">
              <i class="pr-4 mt-3 text-sm fa-solid fa-wine-glass md:pr-8 min-w-6 md:min-w-8 md:text-base"></i>
              <p class="m-0 text-base leading-8 md:text-xl">店名：{{ currentEvent.barName }}</p>
            </div>

            <div class="flex items-start py-1">
              <i class="pr-4 mt-3 text-sm fa-solid fa-location-dot md:pr-8 min-w-6 md:min-w-8 md:text-base"></i>
              <p class="m-0 text-base leading-8 md:text-xl">地址：{{ currentEvent.location }}</p>
            </div>

            <div class="flex items-start py-1">
              <i class="pr-4 mt-3 text-sm fa-solid fa-user md:pr-8 min-w-6 md:min-w-8 md:text-base"></i>
              <p class="m-0 text-base leading-8 md:text-xl">
                目前報名人數：<span>{{ joinedNum }}</span> ｜ 報名人數上限：<span>{{ currentEvent.maxPeople || '無報名人數限制' }}</span>
              </p>
            </div>

            <div class="flex items-start py-1">
              <i class="pr-4 mt-3 text-sm font-bold text-red-800 fa-solid fa-circle-exclamation md:pr-7 min-w-6 md:min-w-8 md:text-base"></i>
              <p class="m-0 text-base font-bold leading-8 text-red-800 md:text-xl">注意： 活動開始前 24 小時內無法取消報名</p>
            </div>

            <!-- 手機版地圖 -->
            <div class="block w-full mt-5 mb-5 bg-gray-500 rounded-lg shadow-md md:hidden h-60">
              <div
                ref="mapContainer"
                class="w-full h-full bg-gray-800 border-0 rounded-lg"
                style="min-height: 240px;"
              ></div>
            </div>

            <!-- 操作按鈕區域 -->
            <div class="flex flex-col gap-0 mt-8 md:flex-row md:gap-8">
              <!-- 主辦人編輯按鈕 -->
              <ModalEdit
                v-if="isHostUser && currentEvent.id"
                :event-id="currentEvent.id"
                :event="currentEvent"
                @update="handleEventUpdate"
              />

              <!-- 非主辦人按鈕 -->
              <template v-else-if="!isHostUser && authStore?.isAuthenticated">
                <button
                  @click="handleJoinToggle"
                  :disabled="isJoin || isUpdating"
                  :class="{ 'opacity-50 cursor-not-allowed': isJoin || isUpdating }"
                  type="button"
                  class="w-full px-8 py-2 text-lg text-center transition-all duration-300 bg-white border-0 shadow-md md:w-auto rounded-2xl md:text-2xl md:px-12 md:py-3 hover:bg-orange-500 hover:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {{ isUpdating ? '處理中...' : (isJoin ? '已報名' : '參加活動') }}
                </button>
                
                <button
                  v-if="isJoin"
                  @click="openCancelModal()"
                  :disabled="!isOver24hr || isUpdating"
                  :class="[
                    'w-full md:w-auto rounded-2xl border-0 text-lg md:text-2xl text-center shadow-md bg-white px-8 md:px-12 py-2 md:py-3 transition-all duration-300 hover:bg-orange-500 hover:text-white mt-4 md:mt-0',
                    (isOver24hr && !isUpdating) ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                  ]"
                  type="button"
                >
                  {{ isUpdating ? '處理中...' : '取消報名' }}
                </button>
              </template>

              <!-- 未登入用戶提示 -->
              <div v-else-if="!authStore?.isAuthenticated" class="w-full">
                <p class="p-4 text-sm text-center bg-gray-200 rounded-lg md:p-5 md:text-base">
                  請先登入以參加活動
                </p>
              </div>            
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 其他組件 -->
    <EventHoster :user="currentEvent.hostUser" class="mb-12" />
    <MessageBoard v-if="isJoin || isHostUser" class="mb-12"/>

    <!-- 確認取消模態框 -->
    <BaseConfirmModal
      :visible="showModal"
      type="warning"
      title="取消報名"
      message="取消後如人數額滿或活動開始前 24 小時內都將無法再次報名，請再次確認您的選擇。"
      confirmText="確認"
      cancelText="取消"
      @confirm="handleCancelConfirm"
      @cancel="closeModal"
    />
  </div>
</template>

<style scoped>
.event-content-box {
  position: relative;
}

/* 確保在小螢幕上內容不會被遮擋 */
@media (max-width: 767px) {
  .event-content-box {
    position: static;
  }
}
</style>