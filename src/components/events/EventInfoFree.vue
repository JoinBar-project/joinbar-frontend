<script setup>
import { useEvent } from '@/composables/useEvent.js';
import { toRef, computed, ref, watch, onMounted } from 'vue';
import { getEventById } from '@/api/event';
import EventHoster from './EventHoster.vue';
import MessageBoard from './MessageBoard.vue';
import ModalEdit from '@/components/events/ModalEdit.vue';
import BaseConfirmModal from '@/components/common/BaseConfirmModal.vue';
import BaseAlertModal from '@/components/common/BaseAlertModal.vue';
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

const alertVisible = ref(false);
const alertType = ref('');
const alertTitle = ref('');
const alertMessage = ref('');

function showAlert(type, title, message) {
  alertType.value = type;
  alertTitle.value = title;
  alertMessage.value = message;
  alertVisible.value = true;
}

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

    <div v-if="isUpdating" class="fixed inset-0 bg-black/50 flex justify-center items-center z-[9999]">
      <div class="bg-white p-8 rounded-[10px] flex items-center gap-4 text-[1.2rem] shadow-md">
        <i class="fa-solid fa-spinner fa-spin text-[var(--color-primary-orange)] pr-[30px] mt-[13px] min-w-[30px]"></i>

        <span>更新中...</span>
      </div>
    </div>

    <div class="max-w-[100vw] pt-[2%] flex justify-center items-center">
      <div class="w-full max-w-[1200px] min-w-[1170px] bg-[#f1f1f1] pb-[30px] mx-auto relative rounded-[20px] overflow-hidden">
        <div>
          <img :src="currentEvent.imageUrl" alt="活動圖片" class="w-full aspect-[3.5/1] object-cover"/>
        </div>
        <div class="event-content-box">
          <div class="absolute bottom-[70px] left-[80px] z-[2] bg-gray-500 rounded-[10px] max-w-[325px] w-[325px] h-[520px] mx-auto shadow-md cursor-pointer">
            <div
              ref="mapContainer"
              class="w-full h-full border-0 rounded-lg"
              style="min-height: 300px; background: #2d2d2d"
            ></div>
          </div>
          <div class="pt-[20px] pr-[70px] pb-[40px] pl-[500px]">
            <div class="flex flex-wrap gap-[10px] mt-[10px]">
              <div v-for="tag in currentTags" :key="tag.id" class="bg-[var(--color-black)] text-white text-center rounded-[20px] px-[20px] py-[8px] whitespace-nowrap">{{ tag.name }}</div>
            </div>

            <h3 class="text-[28px] font-bold mt-[20px] mb-[20px]">{{ currentEvent.name }}</h3>

            <div v-if="formattedEventTime" class="flex items-start py-[1px]">
              <i class="fa-solid fa-calendar pr-[26px] mt-[13px] min-w-[30px]"></i>
              <p class="text-[20px] leading-[2] m-0">活動時間：{{ formattedEventTime }}</p>
            </div>

            <div class="flex items-start py-[1px]">
              <i class="fa-solid fa-wine-glass pr-[30px] mt-[13px] min-w-[30px]"></i>
              <p class="text-[20px] leading-[2] m-0">店名：{{ currentEvent.barName }}</p>
            </div>

            <div class="flex items-start py-[1px]">
              <i class="fa-solid fa-location-dot pr-[30px] mt-[13px] min-w-[30px]"></i>
              <p class="text-[20px] leading-[2] m-0">地址：{{ currentEvent.location }}</p>
            </div>

            <div class="flex items-start py-[1px]">
              <i class="fa-solid fa-user pr-[30px] mt-[13px] min-w-[30px]"></i>
              <p class="text-[20px] leading-[2] m-0">
                目前報名人數：<span>{{ joinedNum }}</span> ｜ 報名人數上限：<span>{{ currentEvent.maxPeople || '無報名人數限制' }}</span>
              </p>
            </div>

            <div class="flex items-start py-[1px]">
              <i class="fa-solid fa-circle-exclamation pr-[26px] text-[#860914] font-bold mt-[13px] min-w-[30px]"></i>
              <p class="text-[20px] leading-[2] m-0 text-[#860914] font-bold">注意： 活動開始前 24 小時內無法取消報名</p>
            </div>

            <div class="flex">

              <!-- 主辦人 -->
              <ModalEdit
                v-if="isHostUser && currentEvent.id"
                :event-id="currentEvent.id"
                :event="currentEvent"
                @update="handleEventUpdate"
              />

              <!-- 非主辦人 -->
              <template v-else-if="!isHostUser && authStore?.isAuthenticated">
                <button
                  @click="handleJoinToggle"
                  :disabled="isJoin || isUpdating"
                  :class="{ 'opacity-50 cursor-not-allowed': isJoin || isUpdating }"
                  type="button"
                  class="event-btn event-btn-free">
                  {{ isUpdating ? '處理中...' : (isJoin ? '已報名' : '參加活動') }}
                </button>
                
                <button
                  v-if="isJoin"
                  @click="openCancelModal()"
                  :disabled="!isOver24hr || isUpdating"
                  :class="['event-btn-free', (isOver24hr && !isUpdating) ? 'cursor-pointer' : 'cursor-not-allowed opacity-50']"
                  type="button"
                  class="event-btn-free">
                  {{ isUpdating ? '處理中...' : '取消報名' }}
                </button>
              </template>

              <!-- 未登入用戶提示 -->
              <div v-else-if="!authStore?.isAuthenticated" class="login-prompt">
                <p style="padding: 20px; background: #f0f0f0; border-radius: 10px; text-align: center;">
                  請先登入以參加活動
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <EventHoster :user="currentEvent.hostUser" class="mb-12" />
    <MessageBoard v-if="isJoin || isHostUser" class="mb-12"/>

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
    <BaseAlertModal
      :visible="alertVisible"
      :type="alertType"
      :title="alertTitle"
      :message="alertMessage"
      @close="alertVisible = false"
    />
  </div>
</template>

<style scoped>
@reference "tailwindcss";

.event-btn-free {
  margin-right: 30px;
  margin-top: 30px;
  border-radius: 20px;
  border: 0;
  font-size: 24px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  background-color: white;
  padding: 8px 45px 10px 45px;
  transition:
    background-color 0.3s ease,
    color 0.3s ease;
}

.event-btn-free:hover:not(:disabled) {
  background-color: var(--color-primary-orange);
  color: white;
}

.event-btn-free:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-prompt {
  margin-top: 30px;
}
</style>
