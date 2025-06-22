<script setup>
import { useEvent } from '@/composables/useEvent.js';
import { useCartStore } from '@/stores/cartStore';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import EventHoster from './EventHoster.vue';
import MessageBoard from './MessageBoard.vue';
import ModalEdit from '@/components/events/ModalEdit.vue';

const props = defineProps({
  event: Object,
  tags: Array,
});

const emit = defineEmits(['update']);
const router = useRouter();
const cart = useCartStore();

const eventRef = ref({ ...props.event });
const tagList = ref([...props.tags]);

const isInCart = computed(() => cart.isInCart(eventRef.value.id));

const authStore = useAuthStore();
const isOwner = computed(() => {
  return authStore.currentUser?.id === eventRef.value.hostUser;
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
  handleConfirmCancel
} = useEvent(eventRef);

const reloadEventData = async () => {
  try {
    const token = localStorage.getItem('access_token');
    const res = await axios.get(`/api/event/${eventRef.value.id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (res.data?.event) {
      eventRef.value = { ...res.data.event };
    }

    if (res.data?.tags) {
      tagList.value = [...res.data.tags];
    }

    emit('update', { event: eventRef.value, tags: tagList.value });
  } catch (error) {
    console.error('活動資料更新失敗', error);
  }
};

const handleEventUpdate = () => {
  reloadEventData();
};

const addToCart = () => {
  try {
    const e = eventRef.value;
    cart.addItem({
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
    alert('已加入購物車！');
  } catch (error) {
    alert(error.message);
  }
};

const buyNow = () => {
  try {
    if (!isInCart.value) addToCart();
    router.push('/payment');
  } catch (error) {
    alert(error.message);
  }
};

onMounted(() => {
  reloadEventData();
});
</script>

<template>
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
            class="w-full h-full rounded-lg border-0">
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
            <button
              @click="addToCart"
              type="button"
              class="event-btn event-btn-cart"
              :disabled="isInCart"
              :class="{ 'opacity-50 cursor-not-allowed': isInCart }"
            >
              {{ isInCart ? '✓ 已在購物車' : '加入購物車' }}
            </button>
            <button @click="buyNow" type="button" class="event-btn event-btn-pay">
              立即報名
            </button>
            <ModalEdit
              v-if="isOwner && eventRef.id"
              :event-id="eventRef.id"
              @update="handleEventUpdate"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
  <EventHoster />
  <MessageBoard v-if="isJoin" />
</template>

<style scoped>
@reference "tailwindcss";

.edit-btn-container {
  @apply flex;
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
}

.event-btn-pay {
  background-color: #860914;
  color: #ecd8d8;
  padding: 8px 16px 10px 16px;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.event-btn-pay:hover {
  background-color: #d4624e;
}

.event-btn-cart {
  background-color: white;
  padding: 8px 28px 10px 28px;
  cursor: pointer;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.event-btn-cart:hover {
  background-color: #bbb;
  color: white;
  padding: 8px 28px 10px 28px;
  cursor: pointer;
}

button:disabled.event-btn-cart:hover {
  background-color: white;
  color: inherit;
  cursor: not-allowed;
}
</style>
