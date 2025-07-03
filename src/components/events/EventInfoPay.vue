<script setup>
import { useEvent } from '@/composables/useEvent.js';
import { useCartStore } from '@/stores/cartStore';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useOrder } from '@/composables/useOrder';
import { useLinePay } from '@/composables/useLinePay';
import EventHoster from './EventHoster.vue';
import MessageBoard from './MessageBoard.vue';
import ModalEdit from '@/components/events/ModalEdit.vue';
import { useAlertModal } from '@/composables/useAlertModal';
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

const { showAlert } = useAlertModal();

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

// 地圖相關
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

// 設置地圖容器
const setupMapContainer = async () => {
  await nextTick();
  const isDesktop = window.innerWidth >= 768;
  const desktopMap = document.querySelector('.desktop-map-container');
  const mobileMap = document.querySelector('.mobile-map-container');
  
  let newContainer = null;
  
  if (isDesktop && desktopMap) {
    newContainer = desktopMap;
    console.log('🗺️ 設置桌面版地圖容器');
  } else if (!isDesktop && mobileMap) {
    newContainer = mobileMap;
    console.log('🗺️ 設置手機版地圖容器');
  }
  
  // 如果容器改變了，重新設置地圖
  if (newContainer && newContainer !== mapContainer.value) {
    mapContainer.value = newContainer;
    
    // 如果地圖 API 已經載入，重新初始化地圖
    if (isReady.value) {
      await initMap();
      if (eventRef.value?.location) {
        displayEventLocation(eventRef.value.location);
      }
    }
  }
};

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
    showAlert('warning', '重複報名', '您已經報名過此活動了！');
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

    showAlert('success', '加入成功', result.message || '已加入購物車！');
  } catch (error) {
    showAlert('error', '加入失敗', error.message);
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
    showAlert('warning', '重複報名', '您已經報名過此活動了！');
    return;
  }

  if (!isAuthenticated.value) {
    showAlert('warning', '尚未登入', '請先登入才能購買');
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
      showAlert('error', '訂單錯誤', '訂單建立失敗，無法獲取訂單 ID，請洽客服人員');
      return;
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
      showAlert('error', '付款失敗', paymentResponse.data?.message || 'LINE Pay 付款失敗，請洽客服人員');
      return;
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
    console.error('❌ 立即購買失敗:', error);
    
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

    showAlert('error', '購買失敗', errorMessage);
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
  await setupMapContainer();
  
  if (mapContainer.value) {
    await initMap();
  }
  
  // 監聽窗口大小變化，使用防抖處理
  let resizeTimer;
  const handleResize = async () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(async () => {
      console.log('📱 螢幕尺寸改變，重新設置地圖...');
      await setupMapContainer();
    }, 300);
  };
  
  window.addEventListener('resize', handleResize);
  
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
  <!-- 主容器 -->
  <div class="flex items-center justify-center max-w-full px-4 pt-4 md:pt-8 md:px-0">
    <div class="w-full max-w-7xl md:min-w-[1170px] bg-gray-100 pb-8 mx-auto relative rounded-xl md:rounded-2xl overflow-hidden">
      <!-- 活動圖片 -->
      <div>
        <img :src="eventRef.imageUrl" alt="活動圖片" class="w-full aspect-[2/1] md:aspect-[3.5/1] object-cover" />
      </div>

      <div class="relative event-content-box">
        <!-- 桌面版地圖 -->
        <div class="hidden md:block absolute bottom-42 left-20 z-10 bg-gray-500 rounded-lg max-w-[325px] w-[325px] h-[520px] shadow-md">
          <div
            class="w-full h-full bg-gray-800 border-0 rounded-lg desktop-map-container"
            style="min-height: 300px;"
          ></div>
        </div>

        <!-- 內容區域 -->
        <div class="pt-5 px-5 pb-10 md:pt-5 md:pr-16 md:pb-10 md:pl-[500px]">
          <!-- 標籤 -->
          <div class="flex flex-wrap gap-2 mb-3 md:gap-3">
            <div 
              v-for="tag in tagList" 
              :key="tag.id" 
              class="px-4 py-2 text-sm text-center text-white bg-black rounded-full md:px-5 whitespace-nowrap md:text-base"
            >
              {{ tag.name }}
            </div>
          </div>

          <!-- 活動標題 -->
          <h3 class="mt-5 mb-5 text-xl font-bold md:text-3xl">{{ eventRef.name }}</h3>

          <!-- 活動資訊 -->
          <div v-if="formattedEventTime" class="flex items-center py-1">
            <i class="pr-4 text-sm fa-solid fa-calendar md:pr-7 min-w-6 md:min-w-8 md:text-base"></i>
            <p class="m-0 text-base leading-10 md:text-xl">活動時間：{{ formattedEventTime }}</p>
          </div>

          <div class="flex items-center py-1">
            <i class="pr-4 text-sm fa-solid fa-wine-glass md:pr-8 min-w-6 md:min-w-8 md:text-base"></i>
            <p class="m-0 text-base leading-10 md:text-xl">店名：{{ eventRef.barName }}</p>
          </div>

          <div class="flex items-center py-1">
            <i class="pr-4 text-sm fa-solid fa-location-dot md:pr-8 min-w-6 md:min-w-8 md:text-base"></i>
            <p class="m-0 text-base leading-10 md:text-xl">地址：{{ eventRef.location }}</p>
          </div>

          <div class="flex items-center py-1">
            <i class="pr-4 text-sm font-bold text-red-800 fa-solid fa-dollar-sign md:pr-8 min-w-6 md:min-w-8 md:text-base"></i>
            <p class="m-0 text-base font-bold leading-10 text-red-800 md:text-xl">
              費用：新台幣 <span>{{ eventRef.price }}</span> 元
            </p>
          </div>

          <div class="flex items-center py-1">
            <i class="pr-4 text-sm font-bold text-red-800 fa-solid fa-circle-exclamation md:pr-7 min-w-6 md:min-w-8 md:text-base"></i>
            <p class="m-0 text-base font-bold leading-10 text-red-800 md:text-xl">注意： 付費活動無法取消</p>
          </div>

          <div class="flex items-center py-1">
            <i class="pr-4 text-sm fa-solid fa-user md:pr-8 min-w-6 md:min-w-8 md:text-base"></i>
            <p class="m-0 text-base leading-10 md:text-xl">
              目前報名人數： <span>{{ joinedNum }}</span> ｜ 報名人數上限：
              <span>{{ eventRef.maxPeople || "無報名人數限制" }}</span>
            </p>
          </div>

          <!-- 手機版地圖 -->
          <div class="block w-full mt-5 mb-5 bg-gray-500 rounded-lg shadow-md md:hidden h-60">
            <div
              class="w-full h-full bg-gray-800 border-0 rounded-lg mobile-map-container"
              style="min-height: 240px;"
            ></div>
          </div>

          <!-- 操作按鈕區域 -->
          <div class="flex flex-col gap-4 mt-8 md:flex-row md:gap-8">
            <!-- 主辦人編輯按鈕 -->
            <ModalEdit
              v-if="isOwner && eventRef.id"
              :event-id="eventRef.id"
              :event="eventRef"
              @update="handleEventUpdate"
            />

            <!-- 非主辦人且已參與：顯示參與狀態 -->
            <div v-else-if="!isOwner && hasParticipated" class="participation-status">
              <div class="flex items-center gap-3 px-6 py-3 text-lg font-semibold text-gray-800 bg-white shadow-md cursor-default md:px-7 rounded-2xl md:text-2xl">
                <i class="text-base fa-solid fa-check-circle md:text-xl text-emerald-500"></i>
                <span>已報名此活動</span>
              </div>
            </div>

            <!-- 非主辦人且未參與：顯示購買按鈕 -->
            <template v-else-if="!isOwner && !hasParticipated && authStore?.isAuthenticated">
              <button
                @click="addToCart"
                type="button"
                class="w-full px-6 py-3 text-lg text-center transition-all duration-300 bg-white border-0 shadow-md md:w-auto rounded-2xl md:text-2xl md:px-7 hover:bg-gray-400 hover:text-white disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-800"
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
                class="w-full px-4 py-3 mt-0 text-lg text-center text-red-100 transition-all duration-300 bg-red-800 border-0 shadow-md md:w-auto rounded-2xl md:text-2xl md:px-4 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-800 md:mt-0"
                :disabled="isProcessing"
              >
                {{ isProcessing ? "處理中..." : "立即報名" }}
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
  <EventHoster :user="eventRef.hostUser" class="mb-6"/>
  <MessageBoard v-if="isJoin || isOwner" class="mb-12"/>
</template>

<style scoped>
.event-content-box {
  position: relative;
}

/* 動畫效果 */
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

/* 確保在小螢幕上內容不會被遮擋 */
@media (max-width: 767px) {
  .participation-status {
    width: 100%;
  }
  
  .participation-status .flex {
    justify-content: center;
    width: 100%;
  }
}
</style>