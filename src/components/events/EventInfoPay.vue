<script setup>
import { useEvent } from '@/composables/useEvent.js';
import { useCartStore } from '@/stores/cartStore';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { ref, computed, onMounted, watch } from 'vue';
import { useOrder } from '@/composables/useOrder';
import { useLinePay } from '@/composables/useLinePay';
import EventHoster from './EventHoster.vue';
import MessageBoard from './MessageBoard.vue';
import ModalEdit from '@/components/events/ModalEdit.vue';
import BaseAlertModal from '@/components/common/BaseAlertModal.vue'
import { useGoogleMaps } from "@/composables/useGoogleMaps/userIndex.js";

const props = defineProps({
  event: Object,
  tags: Array,
  eventId: String,
  user: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['update','close']);

const alertVisible = ref(false)
const alertType = ref('warning')
const alertTitle = ref('')
const alertMessage = ref('')

const showAlert = (type, title, message) => {
  alertType.value = type
  alertTitle.value = title
  alertMessage.value = message
  alertVisible.value = true
}

const router = useRouter();
const cart = useCartStore();
const authStore = useAuthStore();

const { createOrder, apiClient } = useOrder();
const { createLinePayment, redirectToLinePay } = useLinePay();

const eventRef = ref({ ...props.event });
const tagList = ref([...props.tags]);
const isProcessing = ref(false);
const hasParticipated = ref(false);

const isInCart = computed(() => cart.isInCart(eventRef.value.id));

const isOwner = computed(() => {
  const currentUserId = authStore.currentUser?.id || authStore.user?.id;
  const hostUserId = eventRef.value?.hostUser?.id || eventRef.value?.hostUser;
  return currentUserId !== null && hostUserId !== null && Number(currentUserId) === Number(hostUserId);
});

const isAuthenticated = computed(() => {
  return (
    authStore.isAuthenticated ||
    !!authStore.user ||
    !!localStorage.getItem("access_token") ||
    document.cookie.includes("access_token=")
  );
});

const {
  isJoin,
  joinedNum,
  formattedEventTime,
  updateParticipationStatus
} = useEvent(eventRef);

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
} = useGoogleMaps(mapContainer, {
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  onError: (msg) => console.error("Google Maps 錯誤:", msg),
  scrollwheel: false,
});

// 顯示活動位置的函數
const displayEventLocation = async (location) => {
  if (!location || !isReady.value) return;
  try {
    const coordinates = await getGeocode(location);
    if (coordinates) {
      clearMarkers();
      addMarker({
        location: coordinates,
        title: eventRef.value?.barName || "活動地點",
        infoContent: `<div style="font-size: 14px;"><strong>${eventRef.value?.barName || "活動地點"}</strong><br><span style="color: #666;">${location}</span></div>`,
        isBarLike: true,
      });
      panTo(coordinates, 16);
      setZoom(16);
    } else {
      const defaultLocation = { lat: 25.033, lng: 121.5654 };
      panTo(defaultLocation, 12);
      setZoom(12);
    }
  } catch (error) {
    console.error("地圖定位失敗:", error);
    const defaultLocation = { lat: 25.033, lng: 121.5654 };
    panTo(defaultLocation, 12);
    setZoom(12);
  }
};

const checkUserParticipation = async () => {
  if (!isAuthenticated.value || !eventRef.value.id) {
    hasParticipated.value = false;
    return;
  }

  try {
    console.log("🔍 檢查用戶參與狀態...");

    const response = await apiClient.get("/orders/history");
    const orders = response.data.orders || [];

    const hasParticipatedInEvent = orders.some(
      (order) =>
        order.status === "confirmed" &&
        order.items &&
        order.items.some(
          (item) =>
            String(item.eventId) === String(eventRef.value.id) &&
            item.itemType === 1
        )
    );

    hasParticipated.value = hasParticipatedInEvent;
    console.log("🔍 用戶參與狀態 (訂單歷史):", hasParticipated.value);
  } catch (error) {
    console.warn("檢查參與狀態失敗:", error);
    hasParticipated.value = false;
  }
};

const reloadEventData = async () => {
  try {
    console.log("🔄 重新載入活動資料...");

    const res = await apiClient.get(`/event/${eventRef.value.id}`);

    if (res.data?.event) {
      eventRef.value = { ...res.data.event };

      // 更新活動參與狀態和人數
      if (res.data.event.currentParticipants !== undefined) {
        updateParticipationStatus(
          res.data.event.isUserParticipated || false,
          res.data.event.currentParticipants
        );
      }

      // 如果有新的地點資訊，且地圖已準備好，則顯示地點
      if (eventRef.value.location && isReady.value) {
        displayEventLocation(eventRef.value.location);
      }

      console.log("✅ 活動資料已更新:", {
        eventId: eventRef.value.id,
        currentParticipants: res.data.event.currentParticipants,
        isUserParticipated: res.data.event.isUserParticipated,
      });
    }
    if (res.data?.tags) {
      tagList.value = [...res.data.tags];
      console.log("✅ 標籤資料已更新");
    }

    // 在活動資料更新後檢查用戶參與狀態
    await checkUserParticipation();

    // 發出更新事件
    emit("update", { event: eventRef.value, tags: tagList.value });
  } catch (error) {
    console.error("❌ 活動資料更新失敗:", error);

    // 如果活動資料更新失敗，但用戶已登入，仍嘗試檢查參與狀態
    if (isAuthenticated.value) {
      await checkUserParticipation();
    }
  }
};

const addToCart = async () => {
  if (!isAuthenticated.value) {
    showAlert('warning', '尚未登入', '請先登入才能加入購物車');
    return;
  }
  
  if (hasParticipated.value) {

    showAlert('warning', '您已經報名過此活動了！');
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
      starAt: e.startAt,
      endAt: e.endAt,
      maxPeople: e.maxPeople,
      hostUser: e.hostUser,
    });

    showAlert('success', result.message || '已加入購物車！');
  } catch (error) {
    alert(error.message);
  }
};

const buyNow = async () => {
  console.log("🔍 認證狀態檢查:", {
    "authStore.isAuthenticated": authStore.isAuthenticated,
    "authStore.user": !!authStore.user,
    "authStore.accessToken": !!authStore.accessToken,
    "localStorage.access_token": !!localStorage.getItem("access_token"),
    "cookie.access_token": document.cookie.includes("access_token="),
    "computed.isAuthenticated": isAuthenticated.value,
  });

  if (hasParticipated.value) {
    showAlert('warning', '您已經報名過此活動了！');
    
    return;
  }

  if (!isAuthenticated.value) {

    // console.warn('❌ 認證檢查失敗，用戶未登入');
    showAlert('warning', '尚未登入', '請先登入才能加入購物車');

    return;
  }

  console.log("✅ 認證檢查通過，開始購買流程");

  try {
    isProcessing.value = true;
    console.log("🔄 開始立即購買流程...");

    const orderData = {
      items: [
        {
          itemType: 1, // 假設 1 代表活動
          eventId: String(eventRef.value.id),
          quantity: 1,
        },
      ],
      paymentMethod: "linepay",
    };

    console.log("🔄 創建訂單:", orderData);

    const orderResponse = await createOrder(orderData);
    const orderId = orderResponse.order.id || orderResponse.order.orderId;

    if (!orderId) {
      showAlert('error', paymentResponse.data.message || '訂單建立失敗，無法獲取訂單 ID，請洽客服人員');
    }

    console.log("✅ 訂單創建成功:", {
      orderId,
      orderNumber: orderResponse.order.orderNumber,
    });

    console.log("🔄 創建 LINE Pay 付款...");

    const paymentResponse = await apiClient.post("/linepay/create", {
      orderId: String(orderId),
    });

    if (!paymentResponse.data.success) {
      showAlert('error', paymentResponse.data.message || 'LINE Pay 付款失敗，請洽客服人員');

    }

    const paymentResult = paymentResponse.data.data;

    sessionStorage.setItem(
      "pendingOrder",
      JSON.stringify({
        orderId: orderId,
        orderNumber: orderResponse.order.orderNumber,
        transactionId: paymentResult.transactionId,
        eventId: eventRef.value.id,
        returnToEvent: true,
      })
    );

    console.log("✅ LINE Pay 付款準備完成，跳轉中...");

    window.location.href = paymentResult.paymentUrl;
  } catch (error) {
    showAlert('error', '立即購買失敗:', error)
    
    if (error.response) {
      console.error("❌ API 錯誤詳情:", {
        status: error.response.status,
        data: error.response.data,
        url: error.response.config?.url,
      });
    }

    let errorMessage = "購買失敗，請重試";
    if (
      error.message.includes("登入已過期") ||
      error.response?.status === 401
    ) {
      errorMessage = "登入已過期，請重新登入";
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      router.push("/login");
    } else if (error.message.includes("已滿員")) {
      errorMessage = "很抱歉，活動名額已滿！";
    } else if (
      error.message.includes("已結束") ||
      error.message.includes("過期")
    ) {
      errorMessage = "活動已結束，無法報名";
    } else if (
      error.message.includes("重複") ||
      error.message.includes("已參加過")
    ) {
      errorMessage = "您已經報名過此活動了";
      hasParticipated.value = true; // 更新為已參與狀態
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    alert(errorMessage);
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
    console.log("🔄 從 isJoin 更新參與狀態:", hasParticipated.value);
  }
});

watch(
  () => eventRef.value.location,
  (newLoc) => {
    if (newLoc && isReady.value) {
      displayEventLocation(newLoc);
    }
  },
  { immediate: true }
);

onMounted(async () => {
  console.log("🔄 組件掛載，開始載入資料...");
  await loadGoogleMapsAPI();
  if (mapContainer.value) {
    await initMap();
  }
  // 用 eventId 取得最新資料並檢查參與狀態
  if (eventRef.value?.id) {
    await reloadEventData();
  }

  const urlParams = new URLSearchParams(window.location.search);
  // 檢查 URL 中是否有付款成功或訂單相關的參數
  if (
    urlParams.get("paymentSuccess") ||
    urlParams.get("orderId") ||
    urlParams.get("transactionId")
  ) {
    console.log("🔄 從付款頁面返回，延遲重新檢查參與狀態...");
    setTimeout(async () => {
      await checkUserParticipation();
    }, 2000);
  }
});
</script>

<template>

  <div class="flex justify-center items-center pt-[2%] max-w-full">
    <div class="relative w-full max-w-[1200px] min-w-[1170px] bg-[#f1f1f1] rounded-[20px] overflow-hidden pb-[30px]">
      <div>
        <img :src="eventRef.imageUrl" class="w-full aspect-[3.5/1] object-cover" alt="活動圖片" />
      </div>

      <div class="flex">
        <div 
          class="absolute bottom-[70px] left-[80px] z-[2] bg-gray-500 rounded-[10px] max-w-[325px] w-[325px] h-[580px] mx-auto shadow-md cursor-pointer">
          <div
            ref="mapContainer"
            class="w-full h-full border-0 rounded-lg"
            style="min-height: 300px; background: #2d2d2d"
          ></div>


        </div>

        <div class="pt-[40px] pr-[70px] pb-[40px] pl-[500px]">
          <div class="flex mb-[20px]">
            <div v-for="tag in tagList" :key="tag.id" class="bg-[var(--color-black)] text-white text-center rounded-[20px] px-[20px] py-[8px] mr-[10px]">
              {{ tag.name }}
            </div>
          </div>

          <h3 class="text-[28px] my-[10px] font-bold">{{ eventRef.name }}</h3>

          <div v-if="formattedEventTime" class="flex items-center py-[1px]">
            <i class="fa-solid fa-calendar pr-[26px]"></i>
            <p class="text-[20px] leading-[2.5] m-0">活動時間：{{ formattedEventTime }}</p>
          </div>

          <div class="flex items-center py-[1px]">
            <i class="fa-solid fa-wine-glass pr-[30px]"></i>
            <p class="text-[20px] leading-[2.5] m-0">店名：{{ eventRef.barName }}</p>
          </div>

          <div class="flex items-center py-[1px]">
            <i class="fa-solid fa-location-dot pr-[30px]"></i>
            <p class="text-[20px] leading-[2.5] m-0">地址：{{ eventRef.location }}</p>
          </div>
          <div class="flex items-center py-[1px]">
            <i class="fa-solid fa-dollar-sign pr-[30px] text-[#860914] font-bold"></i>
            <p class="text-[20px] leading-[2.5] m-0 text-[#860914] font-bold">費用：新台幣 <span>{{ eventRef.price }}</span> 元</p>
          </div>

          <div class="flex items-center py-[1px]">
            <i class="fa-solid fa-circle-exclamation pr-[26px] text-[#860914] font-bold"></i>
            <p class="text-[20px] leading-[2.5] m-0 text-[#860914] font-bold">注意： 付費活動無法取消</p>
          </div>

          <div class="flex items-center py-[1px]">
            <i class="fa-solid fa-user pr-[30px]"></i>
            <p class="text-[20px] leading-[2.5] m-0">
              目前報名人數： <span>{{ joinedNum }}</span> ｜ 報名人數上限：
              <span>{{ eventRef.maxPeople || "無報名人數限制" }}</span>
            </p>
          </div>

          <div class="flex">
            <!-- 主辦人：顯示編輯按鈕 -->
            <ModalEdit
              v-if="isOwner && eventRef.id"
              :event-id="eventRef.id"
              :event="eventRef"
              @update="handleEventUpdate"
            />

            <!-- 非主辦人且已參與：顯示參與狀態 -->
            <div v-else-if="!isOwner && hasParticipated"  class="participation-status">
              <div class="flex items-center gap-3 bg-white text-[#333] px-7 py-[10px] rounded-[20px] text-[24px] font-semibold shadow-md mt-[30px] mr-[30px] text-center cursor-default">
                <i class="fa-solid fa-check-circle text-[20px] text-emerald-500"></i>
                <span>已報名此活動</span>
              </div>
            </div>

            <!-- 非主辦人且未參與：顯示購買按鈕 -->
            <template v-else-if="!isOwner && !hasParticipated && authStore?.isAuthenticated">
              <button
                @click="addToCart"
                type="button"
                class="mt-[30px] mr-[30px] rounded-[20px] border-0 text-[24px] text-center shadow-md cursor-pointer transition-all duration-300 ease-in-out bg-white pt-[8px] pr-[28px] pb-[10px] pl-[28px] hover:bg-[#bbb] hover:text-white disabled:hover:bg-white disabled:hover:text-inherit opacity-100 disabled:opacity-60 disabled:cursor-not-allowed"
                :disabled="isInCart || isProcessing"
                :class="{
                  'opacity-50 cursor-not-allowed': isInCart || isProcessing,
                }"
              >
                {{
                  isProcessing
                    ? "處理中..."
                    : isInCart
                      ? "✓ 已在購物車"
                      : "加入購物車"
                }}
              </button>
              
              <button 
                @click="buyNow" 
                type="button" 
                class="mt-[30px] mr-[30px] rounded-[20px] border-0 text-[24px] text-center shadow-md cursor-pointer transition-all duration-300 ease-in-out bg-[#860914] text-[#ecd8d8] pt-[8px] pr-[16px] pb-[10px] pl-[16px] hover:bg-[#d4624e] disabled:hover:bg-[#860914]"
                :disabled="isProcessing"
                :class="{ 'opacity-50 cursor-not-allowed': isProcessing }"
              >
                {{ isProcessing ? "處理中..." : "立即報名" }}
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
  <EventHoster :user="eventRef.hostUser" class="mb-6"/>
  <MessageBoard v-if="isJoin" class="mb-12"/>
  <BaseAlertModal
    :visible="alertVisible"
    :type="alertType"
    :title="alertTitle"
    :message="alertMessage"
    @close="alertVisible = false"
    @update="handleModalUpdate"
  />
</template>

<style scoped>
@reference "tailwindcss";


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

.login-prompt {
  margin-top: 30px;
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
