<script setup>
import { useEvent } from '@/composables/useEvent.js';
import { toRef } from 'vue';
import EventHoster from './EventHoster.vue';
import MessageBoard from './MessageBoard.vue';

const props = defineProps({
  event: Object,
  tags: Array,
});

const eventRef = toRef(props, 'event');

const { isJoin, joinedNum, toggleJoin, isOver24hr, showModal, formattedEventTime, openCancelModal, closeModal, handleConfirmCancel } =
  useEvent(eventRef);
</script>

<template>
  <div>
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
            @click="handleConfirmCancel">
            確認取消
          </button>
        </div>
      </div>
    </div>

    <div class="event-information-section">
      <div class="event-information-card">
        <div class="event-img">
          <img :src="props.event.imageUrl" alt="活動圖片" />
        </div>
        <div class="event-content-box">
          <div class="event-map"></div>
          <div class="event-content">
            <div class="event-tags">
              <div
                v-for="tag in props.tags"
                :key="tag.id">
                {{ tag.name }}
              </div>
            </div>
            <div>
              <h3 class="event-title">{{ props.event.name }}</h3>
              <div
                v-if="formattedEventTime"
                class="event-content-info">
                <i class="fa-solid fa-calendar"></i>
                <p>活動時間：{{ formattedEventTime }}</p>
              </div>
              <div class="event-content-info">
                <i class="fa-solid fa-wine-glass"></i>

                <p>店名：{{ props.event.barName }}</p>
              </div>
              <div class="event-content-info">
                <i class="fa-solid fa-location-dot"></i>
                <p>地址：{{ props.event.location }}</p>
              </div>
              <div class="event-content-info">
                <i class="fa-solid fa-user"></i>
                <p>
                  目前報名人數： <span>{{ joinedNum }}</span> ｜ 報名人數上限：<span>{{ props.event.maxPeople || '無報名人數限制' }}</span>
                </p>
              </div>
            </div>
            <button
              @click="toggleJoin()"
              :disabled="isJoin"
              :class="{ 'opacity-50 cursor-not-allowed': isJoin }"
              type="button"
              class="event-btn event-btn-free">
              {{ isJoin ? '已報名' : '參加活動' }}
            </button>
            <button
              v-if="isJoin"
              @click="openCancelModal()"
              :disabled="!isOver24hr"
              :class="['event-btn-free', isOver24hr ? 'cursor-pointer' : 'cursor-not-allowed opacity-50']"
              type="button"
              class="event-btn-free">
              取消報名
            </button>
          </div>
        </div>
      </div>
    </div>
    <EventHoster />
    <MessageBoard v-if="isJoin" />
  </div>
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

.event-btn-free:hover {
  background-color: var(--color-primary-orange);
  color: white;
}
</style>
