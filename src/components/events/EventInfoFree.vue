<script setup>
import { useEvent } from '@/composables/useEvent.js';
import { toRef, computed, ref, watch, onMounted } from 'vue';
import { getEventById } from '@/api/event';
import EventHoster from './EventHoster.vue';
import MessageBoard from './MessageBoard.vue';
import ModalEdit from '@/components/events/ModalEdit.vue'
import { useAuthStore } from '@/stores/authStore'; 
import BaseAlertModal from '@/components/common/BaseAlertModal.vue';

const emit = defineEmits(['update']);

const props = defineProps({
  event: Object,
  tags: Array,
  eventId: String,
  user: {
    type: Object,
    required: true,
}
});

const authStore = useAuthStore(); 

// Modal 狀態管理
const alertModal = ref({
  visible: false,
  title: '',
  message: '',
  type: 'default'
});

// Modal 控制函數
const showAlert = (title, message, type = 'default') => {
  alertModal.value = {
    visible: true,
    title,
    message,
    type
  };
};

const closeAlert = () => {
  alertModal.value.visible = false;
};

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

onMounted(() => {
  console.log('🔥 onMounted currentEvent:', currentEvent.value);
});

const eventRef = toRef(props, 'event');
const localEvent = ref({ ...props.event });
const localTags = ref([...props.tags]);
const isUpdating = ref(false);

const { isJoin, joinedNum, toggleJoin, isOver24hr, showModal, formattedEventTime, openCancelModal, closeModal, handleConfirmCancel } =
  useEvent(eventRef);

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
    showAlert('錯誤', '無法重新載入：缺少活動 ID', 'error');
    return;
  }

  const eventId = props.eventId || localEvent.value.id;
  
  try {
    isUpdating.value = true;
    console.log('開始重新載入活動資料...');
    
    const { event: updatedEvent, tags: updatedTags } = await getEventById(eventId);
    
    if (updatedEvent) {
      localEvent.value = { ...updatedEvent };
    }
    if (updatedTags) {
      localTags.value = [...updatedTags];
    }
    
    console.log('活動資料重新載入成功:', { updatedEvent, updatedTags });
    
    emit('update', {
      event: localEvent.value,
      tags: localTags.value
    });
    
  } catch (error) {
    console.error('重新載入活動資料失敗:', error);
    
    if (error.response?.status === 401) {
      console.warn('認證失敗，可能需要重新登入');
      showAlert('認證失敗', '登入已過期，可能需要重新登入', 'warning');
    } else {
      showAlert('載入失敗', '重新載入活動資料失敗，請稍後再試', 'error');
    }
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

const currentEvent = computed(() => localEvent.value || {});
const currentTags = computed(() => localTags.value || []);

const handleJoinToggle = async () => {
  try {
    await toggleJoin();
    await reloadEventData();
  } catch (error) {
    console.error('報名操作失敗:', error);
    
    let errorMessage = '報名操作失敗，請重試';
    let alertType = 'error';
    
    if (error.message.includes('登入已過期') || error.response?.status === 401) {
      errorMessage = '登入已過期，請重新登入';
      alertType = 'warning';
    } else if (error.message.includes('已滿員')) {
      errorMessage = '很抱歉，活動名額已滿！';
      alertType = 'warning';
    } else if (error.message.includes('已結束') || error.message.includes('過期')) {
      errorMessage = '活動已結束，無法報名';
      alertType = 'warning';
    } else if (error.message.includes('重複') || error.message.includes('已報名')) {
      errorMessage = '您已經報名過此活動了';
      alertType = 'info';
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    showAlert('報名失敗', errorMessage, alertType);
  }
};

const handleCancelConfirm = async () => {
  try {
    await handleConfirmCancel();
    await reloadEventData();
    showAlert('成功', '已成功取消報名', 'success');
  } catch (error) {
    console.error('取消報名失敗:', error);
    
    let errorMessage = '取消報名失敗，請重試';
    let alertType = 'error';
    
    if (error.message.includes('登入已過期') || error.response?.status === 401) {
      errorMessage = '登入已過期，請重新登入';
      alertType = 'warning';
    } else if (error.message.includes('24小時')) {
      errorMessage = '活動開始前24小時內無法取消報名';
      alertType = 'warning';
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    showAlert('取消失敗', errorMessage, alertType);
  }
};
</script>

<template>
  <!-- Alert Modal -->
  <BaseAlertModal
    :visible="alertModal.visible"
    :title="alertModal.title"
    :message="alertModal.message"
    :type="alertModal.type"
    @close="closeAlert"
  />

  <div>
    <div v-if="isUpdating" class="loading-overlay">
      <div class="loading-message">
        <i class="fa-solid fa-spinner fa-spin"></i>
        <span>更新中...</span>
      </div>
    </div>

    <div :class="['modal', { 'modal-open': showModal }]">
      <div class="modal-box">
        <h3 class="text-lg font-bold">確認取消報名</h3>
        <p class="py-4">
          您確定要取消這次報名嗎？ <br />
          <span>取消後如人數額滿或是活動開始前24小時內都將無法報名</span>， <br />
          請再次確認您的選擇。
        </p>
        <div class="modal-action">
          <button
            class="btn"
            @click="closeModal">
            放棄取消
          </button>
          <button
            class="btn"
            @click="handleCancelConfirm">
            確認取消
          </button>
        </div>
      </div>
    </div>

    <div class="event-information-section">
      <div class="event-information-card">
        <div class="event-img">
          <img :src="currentEvent.imageUrl" alt="活動圖片" />
        </div>
        <div class="event-content-box">
          <div class="event-map">
            <iframe 
              v-if="currentEvent.location"
              :src="`https://www.google.com/maps?q=${encodeURIComponent(currentEvent.location)}&output=embed`"
              class="w-full h-full border-0 rounded-lg">
            </iframe>
          </div>
          <div class="event-content">
            <div class="event-tags">
              <div
                v-for="tag in currentTags"
                :key="tag.id">
                {{ tag.name }}
              </div>
            </div>

            <div>
              <h3 class="event-title">
                {{ currentEvent.name }}
              </h3>

              <div
                v-if="formattedEventTime"
                class="event-content-info">
                <i class="fa-solid fa-calendar"></i>
                <p>活動時間：{{ formattedEventTime }}</p>
              </div>

              <div class="event-content-info">
                <i class="fa-solid fa-wine-glass"></i>
                <p>店名：{{ currentEvent.barName }}</p>
              </div>

              <div class="event-content-info">
                <i class="fa-solid fa-location-dot"></i>
                <p>地址：{{ currentEvent.location }}</p>
              </div>

              <div class="event-content-info">
                <i class="fa-solid fa-user"></i>
                <p>
                  目前報名人數： <span>{{ joinedNum }}</span> ｜ 報名人數上限：<span>{{ currentEvent.maxPeople || '無報名人數限制' }}</span>
                </p>
              </div>
            </div>
            
            <div class="edit-btn-container">
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

    <EventHoster :user="currentEvent.hostUser" />
    <MessageBoard v-if="isJoin" />
  </div>
</template>

<style scoped>
@reference "tailwindcss";

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.loading-message {
  background-color: white;
  padding: 2rem;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 1.2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

.loading-message i {
  color: var(--color-primary-orange);
}

.edit-btn-container {
  @apply flex flex-col;
}

.event-information-section {
  max-width: 100vw;
  padding-top: 2%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.event-information-card {
  max-width: 1200px;
  min-width: 1170px;
  width: 100%;
  background-color: #f1f1f1;
  padding-bottom: 30px;
  margin: 0 auto;
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  position: relative;
}

.apply-tag {
  background-color: var(--color-primary-red);
  color: #f1f1f1;
  padding: 20px 80px;
  font-size: 28px;
  position: absolute;
  top: 0;
  right: 80px;
}

.event-img > img {
  width: 100%;
  aspect-ratio: 3.5 / 1;
  object-fit: cover;
}

.event-map {
  position: absolute;
  bottom: 70px;
  left: 80px;
  z-index: 2;
  background-color: gray;
  border-radius: 10px;
  max-width: 325px;
  width: 325px;
  height: 500px;
  margin: 0 auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  cursor: pointer;
}

.event-tags {
  display: flex;
  margin-top: 10px;
  flex-wrap: wrap;
  gap: 10px;
}

.event-tags div {
  background-color: var(--color-black);
  padding: 8px 20px;
  text-align: center;
  border-radius: 20px;
  color: white;
  white-space: nowrap;
}

.event-content-box {
  display: flex;
}

.event-content {
  padding: 20px 70px 40px 500px;
}

.event-content-info {
  display: flex;
  align-items: top;
  padding: 1px 0;
}

.event-content-info p {
  font-size: 20px;
  line-height: 2;
  margin: 0;
}

.fa-solid {
  padding: 0 30px 0 0;
  margin-top: 13px;
  min-width: 30px;
}

.fa-calendar {
  padding-right: 26px;
}

.event-title {
  font-size: 28px;
  font-weight: bold;
  margin-top: 20px;
  margin-bottom: 20px;
}

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

.login-prompt {
  margin-top: 30px;
}

:deep(.BaseAlertModal) {
  z-index: 99999 !important;
}
</style>