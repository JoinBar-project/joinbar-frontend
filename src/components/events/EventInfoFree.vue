<script setup>
import { useEvent } from '@/composables/useEvent.js';
import { toRef, computed, ref, watch, onMounted } from 'vue';
import { getEventById } from '@/api/event';
import EventHoster from './EventHoster.vue';
import MessageBoard from './MessageBoard.vue';
import ModalEdit from '@/components/events/ModalEdit.vue';
import BaseConfirmModal from '@/components/common/BaseConfirmModal.vue';
import BaseAlertModal from '@/components/common/BaseAlertModal.vue'

const emit = defineEmits(['update']);

const props = defineProps({
  event: Object,
  tags: Array,
  eventId: String,
  user: {
    type: Object,
    required: true,
  },
});

const currentUserId = computed(() => {
  const user = JSON.parse(localStorage.getItem('user'));
  return user?.id ? Number(user.id) : null;
});

const eventRef = toRef(props, 'event');
const localEvent = ref({ ...props.event });
const localTags = ref([...props.tags]);
const isUpdating = ref(false);

const {
  isJoin,
  joinedNum,
  toggleJoin,
  isOver24hr,
  showModal,
  formattedEventTime,
  openCancelModal,
  closeModal,
  handleConfirmCancel
} = useEvent(eventRef);

const currentUser = computed(() => props.user || {});
const currentEvent = computed(() => localEvent.value || {});
const currentTags = computed(() => localTags.value || []);

const isHostUser = computed(() => {
  return currentUserId.value !== null && Number(currentEvent.value.hostUser) === currentUserId.value;
});

onMounted(() => {
  console.log('🔥 onMounted currentEvent:', currentEvent.value);
});

watch(() => props.event, (newEvent) => {
  if (newEvent && !isUpdating.value) {
    localEvent.value = { ...newEvent };
    console.log('事件資料已更新:', newEvent);
  }
}, { deep: true, immediate: true });

watch(() => props.tags, (newTags) => {
  if (newTags && !isUpdating.value) {
    localTags.value = [...newTags];
    console.log('標籤資料已更新:', newTags);
  }
}, { deep: true, immediate: true });

async function reloadEventData() {
  if (!props.eventId && !localEvent.value?.id) {
    console.error('無法重新載入：缺少活動 ID');
    return;
  }
  const eventId = props.eventId || localEvent.value.id;
  try {
    isUpdating.value = true;
    const { event: updatedEvent, tags: updatedTags } = await getEventById(eventId);
    if (updatedEvent) localEvent.value = { ...updatedEvent };
    if (updatedTags) localTags.value = [...updatedTags];
    emit('update', {
      event: localEvent.value,
      tags: localTags.value,
    });
  } catch (error) {
    console.error('重新載入活動資料失敗:', error);
  } finally {
    isUpdating.value = false;
  }
}

async function handleEventUpdate() {
  console.log('活動更新完成，準備重新載入資料...');
  setTimeout(async () => {
    await reloadEventData();
  }, 500);
}

const handleJoinToggle = async () => {
  try {
    await toggleJoin();
    await reloadEventData();
  } catch (error) {
    console.error('報名操作失敗:', error);
  }
};

const handleCancelConfirm = async () => {
  try {
    await handleConfirmCancel();
    await reloadEventData();
  } catch (error) {
    console.error('取消報名失敗:', error);
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
            <iframe
              v-if="currentEvent.location"
              :src="`https://www.google.com/maps?q=${encodeURIComponent(currentEvent.location)}&output=embed`"
              class="w-full h-full rounded-lg border-0">
            </iframe>
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

              <ModalEdit
                v-if="currentEvent.id && isHostUser"
                :event-id="currentEvent.id"
                @update="handleEventUpdate"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <EventHoster :user="currentEvent.hostUser" class="mb-12" />
    <MessageBoard v-if="isJoin" class="mb-12"/>

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
  transition: background-color 0.3s ease, color 0.3s ease;
}

.event-btn-free:hover:not(:disabled) {
  background-color: var(--color-primary-orange);
  color: white;
}

.event-btn-free:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>