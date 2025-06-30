<script setup>
import { useEvent } from '@/composables/useEvent.js';
import { useCartStore } from '@/stores/cartStore';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { useOrder } from '@/composables/useOrder';
import { useLinePay } from '@/composables/useLinePay';
import { ref, computed, onMounted, watch } from 'vue';
import EventHoster from './EventHoster.vue';
import MessageBoard from './MessageBoard.vue';
import ModalEdit from '@/components/events/ModalEdit.vue';
import BaseAlertModal from '@/components/common/BaseAlertModal.vue';
import BaseConfirmModal from '@/components/common/BaseConfirmModal.vue';

const props = defineProps({
  event: Object,
  tags: Array,
});

const emit = defineEmits(['update']);
const router = useRouter();
const cart = useCartStore();
const authStore = useAuthStore();

const { createOrder, apiClient } = useOrder();
const { createLinePayment, redirectToLinePay } = useLinePay();

const eventRef = ref({ ...props.event });
const tagList = ref([...props.tags]);
const isProcessing = ref(false);
const hasParticipated = ref(false); 

const alertModal = ref({
  visible: false,
  title: '',
  message: '',
  type: 'default'
});

const confirmModal = ref({
  visible: false,
  title: '',
  message: '',
  type: null,
  confirmAction: null
});

const showAlert = (title, message, type = 'default') => {
  alertModal.value = {
    visible: true,
    title,
    message,
    type
  };
};

const showConfirm = (title, message, type = null) => {
  return new Promise((resolve) => {
    confirmModal.value = {
      visible: true,
      title,
      message,
      type,
      confirmAction: resolve
    };
  });
};

const closeAlert = () => {
  alertModal.value.visible = false;
};

const closeConfirm = () => {
  confirmModal.value.visible = false;
  if (confirmModal.value.confirmAction) {
    confirmModal.value.confirmAction(false);
  }
};

const handleConfirm = () => {
  confirmModal.value.visible = false;
  if (confirmModal.value.confirmAction) {
    confirmModal.value.confirmAction(true);
  }
};

const isOwner = computed(() => {
  const currentUserId = authStore.currentUser?.id || authStore.user?.id;
  const hostUserId = eventRef.value?.hostUser?.id || eventRef.value?.hostUser;
  return currentUserId !== null && hostUserId !== null && Number(currentUserId) === Number(hostUserId);
});

const isInCart = computed(() => cart.isInCart(eventRef.value.id));

const isAuthenticated = computed(() => {
  return authStore.isAuthenticated || 
         !!authStore.user || 
         !!localStorage.getItem('access_token') ||
         document.cookie.includes('access_token=');
});

const {
  isJoin,
  joinedNum,
  showModal,
  formattedEventTime,
  closeModal,
  handleConfirmCancel,
  updateParticipationStatus
} = useEvent(eventRef);

const checkUserParticipation = async () => {
  if (!isAuthenticated.value || !eventRef.value.id) {
    hasParticipated.value = false;
    return;
  }

  try {
    console.log('🔍 檢查用戶參與狀態...');
    
    const response = await apiClient.get('/orders/history');
    
    const orders = response.data.orders || [];
    const hasParticipatedInEvent = orders.some(order => 
      order.status === 'confirmed' && 
      order.items && order.items.some(item => 
        String(item.eventId) === String(eventRef.value.id) && item.itemType === 1
      )
    );
    
    hasParticipated.value = hasParticipatedInEvent;
    console.log('🔍 用戶參與狀態 (訂單歷史):', hasParticipated.value);

    if (!hasParticipated.value && isJoin.value) {
      hasParticipated.value = isJoin.value;
      console.log('🔍 用戶參與狀態 (isJoin 補充):', hasParticipated.value);
    }

  } catch (error) {
    console.warn('檢查參與狀態失敗:', error);
    hasParticipated.value = isJoin.value || false;
  }
};

const reloadEventData = async () => {
  try {
    console.log('🔄 重新載入活動資料...');
    
    const res = await apiClient.get(`/event/${eventRef.value.id}`);

    if (res.data?.event) {
      eventRef.value = { ...res.data.event };
      
      if (res.data.event.currentParticipants !== undefined) {
        updateParticipationStatus(
          res.data.event.isUserParticipated || false,
          res.data.event.currentParticipants
        );
      }
      
      console.log('✅ 活動資料已更新:', {
        eventId: eventRef.value.id,
        currentParticipants: res.data.event.currentParticipants,
        isUserParticipated: res.data.event.isUserParticipated
      });
    }
    if (res.data?.tags) {
      tagList.value = [...res.data.tags];
      console.log('✅ 標籤資料已更新');
    }

    await checkUserParticipation();

    emit('update', { event: eventRef.value, tags: tagList.value });
  } catch (error) {
    console.error('❌ 活動資料更新失敗:', error);
    
    if (isAuthenticated.value) {
      await checkUserParticipation();
    }
  }
};

const addToCart = async () => {
  if (hasParticipated.value) {
    showAlert('提醒', '您已經報名過此活動了！', 'warning');
    return;
  }

  try {
    const e = eventRef.value;
    const result = await cart.addItem({
      id: e.id,
      name: e.name,
      price: e.price,
      imageUrl: e.imageUrl,
      barName: e.barName,
      location: e.location,
      startDate: e.startDate,
      endDate: e.endDate,
      maxPeople: e.maxPeople,
      hostUser: e.hostUser,
    });
    showAlert('成功', result.message || '已加入購物車！', 'success');
  } catch (error) {
    showAlert('錯誤', error.message, 'error');
  }
};

const buyNow = async () => {
  console.log('🔍 認證狀態檢查:', {
    'authStore.isAuthenticated': authStore.isAuthenticated,
    'authStore.user': !!authStore.user,
    'authStore.accessToken': !!authStore.accessToken,
    'localStorage.access_token': !!localStorage.getItem('access_token'),
    'cookie.access_token': document.cookie.includes('access_token='),
    'computed.isAuthenticated': isAuthenticated.value
  });

  if (hasParticipated.value) {
    showAlert('提醒', '您已經報名過此活動了！', 'warning');
    return;
  }

  if (!isAuthenticated.value) {
    console.warn('❌ 認證檢查失敗，用戶未登入');
    const shouldLogin = await showConfirm(
      '需要登入',
      '請先登入後再進行購買\n\n點擊「確定」前往登入頁面',
      'question'
    );
    if (shouldLogin) router.push('/login');
    return;
  }

  console.log('✅ 認證檢查通過，開始購買流程');

  try {
    isProcessing.value = true;
    console.log('🔄 開始立即購買流程...');

    const orderData = {
      items: [{
        itemType: 1,
        eventId: String(eventRef.value.id),
        quantity: 1
      }],
      paymentMethod: 'linepay'
    };

    console.log('🔄 創建訂單:', orderData);
    
    const orderResponse = await createOrder(orderData);
    const orderId = orderResponse.order.id || orderResponse.order.orderId;

    if (!orderId) {
      throw new Error('訂單創建失敗，無法獲取訂單 ID');
    }

    console.log('✅ 訂單創建成功:', {
      orderId,
      orderNumber: orderResponse.order.orderNumber
    });

    console.log('🔄 創建 LINE Pay 付款...');
    
    const paymentResponse = await apiClient.post('/linepay/create', {
      orderId: String(orderId)
    });

    if (!paymentResponse.data.success) {
      throw new Error(paymentResponse.data.message || 'LINE Pay 創建失敗');
    }

    const paymentResult = paymentResponse.data.data;
    
    sessionStorage.setItem('pendingOrder', JSON.stringify({
      orderId: orderId,
      orderNumber: orderResponse.order.orderNumber,
      transactionId: paymentResult.transactionId,
      eventId: eventRef.value.id,
      returnToEvent: true
    }));

    console.log('✅ LINE Pay 付款準備完成，跳轉中...');

    window.location.href = paymentResult.paymentUrl;

  } catch (error) {
    console.error('❌ 立即購買失敗:', error);
    
    if (error.response) {
      console.error('❌ API 錯誤詳情:', {
        status: error.response.status,
        data: error.response.data,
        url: error.response.config?.url
      });
    }
    
    let errorMessage = '購買失敗，請重試';
    let alertType = 'error';
    
    if (error.message.includes('登入已過期') || error.response?.status === 401) {
      errorMessage = '登入已過期，請重新登入';
      alertType = 'warning';
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      setTimeout(() => router.push('/login'), 2000);
    } else if (error.message.includes('已滿員')) {
      errorMessage = '很抱歉，活動名額已滿！';
      alertType = 'warning';
    } else if (error.message.includes('已結束') || error.message.includes('過期')) {
      errorMessage = '活動已結束，無法報名';
      alertType = 'warning';
    } else if (error.message.includes('重複') || error.message.includes('已參加過')) {
      errorMessage = '您已經報名過此活動了';
      alertType = 'warning';
      hasParticipated.value = true;
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    showAlert('購買失敗', errorMessage, alertType);
  } finally {
    isProcessing.value = false;
  }
};

const handleEventUpdate = () => {
  reloadEventData();
};

watch(isJoin, (newValue) => {
  if (newValue && !hasParticipated.value) {
    hasParticipated.value = newValue;
    console.log('🔄 從 isJoin 更新參與狀態:', hasParticipated.value);
  }
});

onMounted(async () => {
  console.log('🔄 組件掛載，開始載入資料...');
  await reloadEventData();
  
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('paymentSuccess') || urlParams.get('orderId')) {
    console.log('🔄 從付款頁面返回，延遲重新檢查參與狀態...');
    setTimeout(async () => {
      await checkUserParticipation();
    }, 2000);
  }
});
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

  <!-- Confirm Modal -->
  <BaseConfirmModal
    :visible="confirmModal.visible"
    :title="confirmModal.title"
    :message="confirmModal.message"
    :type="confirmModal.type"
    @confirm="handleConfirm"
    @cancel="closeConfirm"
  />

  <div :class="['modal', { 'modal-open': showModal }]">
    <div class="modal-box">
      <h3 class="text-lg font-bold">確認取消報名</h3>
      <p class="py-4">
        您確定要取消這次報名嗎？<br />
        <span>取消後如人數額滿或是活動開始前24小時內都將無法報名</span>，<br />
        請再次確認您的選擇。
      </p>
      <div class="modal-action">
        <button class="btn" @click="closeModal">放棄取消</button>
        <button class="btn" @click="handleConfirmCancel">確認取消</button>
      </div>
    </div>
  </div>

  <div class="event-information-section">
    <div class="event-information-card">
      <div class="event-img">
        <img :src="eventRef.imageUrl" alt="活動圖片" />
      </div>

      <div class="event-content-box">
        <div class="event-map">
          <iframe 
            v-if="eventRef.location"
            :src="`https://www.google.com/maps?q=${encodeURIComponent(eventRef.location)}&output=embed`"
            class="w-full h-full border-0 rounded-lg">
          </iframe>
        </div>

        <div class="event-content">
          <div class="event-tags">
            <div v-for="tag in tagList" :key="tag.id">
              {{ tag.name }}
            </div>
          </div>

          <h3 class="event-title">{{ eventRef.name }}</h3>

          <div v-if="formattedEventTime" class="event-content-info">
            <i class="fa-solid fa-calendar"></i>
            <p>活動時間：{{ formattedEventTime }}</p>
          </div>

          <div class="event-content-info">
            <i class="fa-solid fa-wine-glass"></i>
            <p>店名：{{ eventRef.barName }}</p>
          </div>

          <div class="event-content-info">
            <i class="fa-solid fa-location-dot"></i>
            <p>地址：{{ eventRef.location }}</p>
          </div>

          <div class="event-content-info">
            <i class="fa-solid fa-dollar-sign"></i>
            <p class="event-payment">費用：新台幣 <span>{{ eventRef.price }}</span> 元</p>
          </div>

          <div class="event-content-info">
            <i class="fa-solid fa-user"></i>
            <p>
              目前報名人數： <span>{{ joinedNum }}</span> ｜ 報名人數上限：
              <span>{{ eventRef.maxPeople || '無報名人數限制' }}</span>
            </p>
          </div>

          <div class="edit-btn-container">
            <!-- 主辦人：顯示編輯按鈕 -->
            <ModalEdit
              v-if="isOwner && eventRef.id"
              :event-id="eventRef.id"
              :event="eventRef"
              @update="handleEventUpdate"
            />
          
            <!-- 非主辦人且未參與：顯示購買按鈕 -->
            <template v-else-if="!isOwner && !hasParticipated && authStore?.isAuthenticated">
              <button
                @click="addToCart"
                type="button"
                class="event-btn event-btn-cart"
                :disabled="isInCart || isProcessing"
                :class="{ 'opacity-50 cursor-not-allowed': isInCart || isProcessing }"
              >
                {{ isProcessing ? '處理中...' : (isInCart ? '✓ 已在購物車' : '加入購物車') }}
              </button>
              
              <button 
                @click="buyNow" 
                type="button" 
                class="event-btn event-btn-pay"
                :disabled="isProcessing"
                :class="{ 'opacity-50 cursor-not-allowed': isProcessing }"
              >
                {{ isProcessing ? '處理中...' : '立即報名' }}
              </button>
            </template>
          
            <!-- 非主辦人且已參與：顯示參與狀態 -->
            <div v-else-if="!isOwner && hasParticipated" class="participation-status">
              <div class="participation-badge">
                <i class="fa-solid fa-check-circle"></i>
                <span>已報名此活動</span>
              </div>
            </div>
            
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
  <EventHoster />
  <MessageBoard v-if="hasParticipated" />
</template>

<style scoped>
@reference "tailwindcss";

.edit-btn-container {
  @apply flex flex-col;
}

.participation-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: white;
  color: #333;
  padding: 8px 28px 10px 28px;
  border-radius: 20px;
  font-size: 24px;
  font-weight: 600;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  margin-top: 30px;
  margin-right: 30px;
  border: 0;
  text-align: center;
  cursor: default;
}

.participation-badge i {
  font-size: 20px;
  color: #10b981;
}

.login-prompt {
  margin-top: 30px;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
  min-width: 1000px;
  width: 100%;
  background-color: #f1f1f1;
  padding-bottom: 30px;
  margin: 0 auto;
  position: relative;
  border-radius: 20px;
  overflow: hidden;
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
  height: 550px;
  margin: 0 auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  cursor: pointer;
}

.event-tags {
  display: flex;
  margin-bottom: 20px;
}

.event-tags div {
  background-color: var(--color-black);
  padding: 8px 20px;
  text-align: center;
  margin-right: 10px;
  border-radius: 20px;
  color: white;
}

.event-content-box {
  display: flex;
}

.event-content {
  padding: 40px 70px 40px 500px;
}

.event-content-info {
  display: flex;
  align-items: center;
  padding: 1px 0;
}

.event-content-info p {
  font-size: 20px;
  line-height: 2.5;
  margin: 0;
}

.fa-solid {
  padding: 0 30px 0 0;
}

.fa-calendar {
  padding-right: 26px;
}

.event-title {
  font-size: 28px;
  margin: 10px 0;
  font-weight: bold;
}

.event-payment,
.fa-dollar-sign {
  color: #860914;
  font-weight: bold;
}

.event-btn {
  margin-right: 30px;
  margin-top: 30px;
  border-radius: 20px;
  border: 0;
  font-size: 24px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
}

.event-btn-pay {
  background-color: #860914;
  color: #ecd8d8;
  padding: 8px 16px 10px 16px;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.event-btn-pay:hover:not(:disabled) {
  background-color: #d4624e;
}

.event-btn-cart {
  background-color: white;
  padding: 8px 28px 10px 28px;
  cursor: pointer;
}

.event-btn-cart:hover:not(:disabled) {
  background-color: #bbb;
  color: white;
}

.event-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

button:disabled.event-btn-cart:hover {
  background-color: white;
  color: inherit;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .participation-badge {
    padding: 12px 24px;
    font-size: 16px;
    margin-top: 20px;
  }
  
  .event-information-card {
    min-width: auto;
  }
  
  .event-content {
    padding: 20px;
  }
  
  .event-map {
    position: relative;
    left: 0;
    bottom: 0;
    width: 100%;
    max-width: 100%;
    height: 300px;
    margin-bottom: 20px;
  }
}
</style>