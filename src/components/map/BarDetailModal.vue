<template>
  <transition name="modal-fade">
    <div class="bar-detail-modal-overlay" @click.self="closeModal">
      <div class="bar-detail-modal-content">
        <button class="close-button" @click="closeModal">
          <img
            src="@/assets/icons/mapicons/close-button.svg"
            alt="關閉"
            class="icon close-icon"
          />
        </button>

        <div class="content-flex-wrapper">
          <div class="image-gallery-container">
            <img
              :src="currentImage"
              alt="未提供圖片"
              class="main-image"
              @error="handleImageError"
            />
            <div v-if="bar.images && bar.images.length > 1" class="image-nav">
              <button class="nav-button prev-button" @click="prevImage">
                &lt;
              </button>
              <button class="nav-button next-button" @click="nextImage">
                &gt;
              </button>
            </div>
            <div class="image-dots">
              <span
                v-for="(img, index) in bar.images"
                :key="index"
                :class="{ dot: true, active: index === currentImageIndex }"
                @click="setCurrentImage(index)"
              ></span>
            </div>
          </div>

          <div class="detail-info-section">
            <div class="header-main">
              <h2 class="bar-detail-name">{{ bar.name }}</h2>
            </div>

            <div class="rating-info">
              <span class="rating-text"
                >⭐️ {{ bar.rating || "N/A" }} ({{
                  bar.reviews || 0
                }}
                評論)</span
              >
            </div>

            <div class="contact-info">
              <p v-if="bar.address">📍 {{ bar.address }}</p>
              <p v-if="bar.phone">📞 {{ bar.phone }}</p>
              <p v-if="bar.website">
                🌐
                <a
                  :href="bar.website"
                  target="_blank"
                  rel="noopener noreferrer"
                  >{{ bar.website }}</a
                >
              </p>
            </div>

            <div class="opening-hours-detail">
              <h3>營業時間</h3>
              <p>
                <span v-html="currentOpenStatus"></span>
              </p>
              <ul v-if="bar.opening_hours && bar.opening_hours.weekday_text">
                <li
                  v-for="(text, index) in bar.opening_hours.weekday_text"
                  :key="index"
                >
                  {{ text }}
                </li>
              </ul>
              <p v-else>未提供詳細營業時間</p>
            </div>
            <div v-if="bar.tags && bar.tags.length" class="bar-tags-detail">
              <h3>特色標籤</h3>
              <div class="tags-wrapper">
                <span
                  v-for="(tag, index) in bar.tags"
                  :key="index"
                  class="detail-tag"
                  >{{ getTagLabel(tag) }}</span
                >
              </div>
            </div>

            <div class="description-section">
              <h3>酒吧介紹</h3>
              <p>{{ bar.description || "暫無詳細介紹。" }}</p>
            </div>

            <div class="google-review-section">
              <h3>熱門評論</h3>
              <template v-if="bar.googleReviews && bar.googleReviews.length">
                <div
                  class="review-card"
                  v-for="(review, idx) in bar.googleReviews.slice(0, 5)"
                  :key="idx"
                >
                  <div class="review-header">
                    <img
                      :src="
                        review.profile_photo_url ||
                        'https://via.placeholder.com/40'
                      "
                      alt="User Avatar"
                      class="user-avatar"
                    />
                    <div class="user-info">
                      <span class="user-name">{{
                        review.author_name || "匿名用戶"
                      }}</span>
                      <span class="review-date">{{
                        formatReviewDate(review.time)
                      }}</span>
                    </div>
                  </div>
                  <p class="review-text">{{ review.text }}</p>
                  <div class="review-actions">
                    <span>👍 有用 ({{ review.rating || 0 }})</span>
                    <span>👎 不喜歡 ({{ review.rating || 0 }})</span>
                  </div>
                </div>
              </template>
              <p v-else>暫無 Google 評論</p>
            </div>
          </div>
        </div>

        <div class="footer-actions">
          <div class="action-buttons-group">
            <button
              class="action-button icon-button share-button"
              data-tooltip="分享"
            >
              <img
                src="@/assets/icons/mapicons/share-icon.svg"
                alt="分享"
                class="icon"
              />
            </button>
            <button
              class="action-button icon-button navigate-button"
              data-tooltip="導航"
              @click="() => navigateToBar(bar)"
            >
              <img
                src="@/assets/icons/mapicons/navigation-icon.svg"
                alt="導航"
                class="icon"
              />
            </button>
            <button
              class="action-button icon-button wishlist-detail-button"
              @click.stop="toggleFavorite"
              :aria-label="bar.isWishlisted ? '取消收藏' : '加入收藏'"
              :data-tooltip="bar.isWishlisted ? '取消收藏' : '加入收藏'"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                :fill="bar.isWishlisted ? 'red' : 'none'"
                :stroke="bar.isWishlisted ? 'red' : '#7f7f7f'"
                stroke-width="1.5"
                class="heart-icon"
              >
                <path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                />
              </svg>
            </button>
          </div>
          <button class="start-event-button" @click="goToBarActivities">
            發起活動
            <img
              src="@/assets/icons/mapicons/plus-icon.svg"
              alt="加號"
              class="icon-plus"
            />
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import { useRouter } from "vue-router";
import placeTypeMap from "@/composables/placeTypeMap";
import { navigateToBar } from "@/utils/useGoogleMapNavigation";

const props = defineProps({
  bar: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["close", "toggle-wishlist"]);

const router = useRouter();

const currentImageIndex = ref(0);
const defaultImage =
  "https://placehold.co/800x600/decdd5/860914?text=No+Image+Available";

// 確保 google 實例可用
const google = computed(() =>
  window.google && window.google.maps ? window.google.maps : null
);

const currentImage = computed(() => {
  if (props.bar.images && props.bar.images.length > 0) {
    return props.bar.images?.[currentImageIndex.value];
  }
  return props.bar.imageUrl || defaultImage;
});

// 修改營業狀態判斷邏輯，直接使用 is_open
const currentOpenStatus = computed(() => {
  if (props.bar.is_open === true) {
    return '<span style="color: green;">正在營業中</span>';
  }
  if (props.bar.is_open === false) {
    return '<span style="color: red;">目前休息中</span>';
  }
  // return "未提供營業時間資訊";
});

watch(
  () => props.bar,
  () => {
    currentImageIndex.value = 0;
  },
  { immediate: true }
);

const prevImage = () => {
  if (!props.bar.images || props.bar.images.length === 0) return;
  currentImageIndex.value =
    (currentImageIndex.value - 1 + props.bar.images.length) %
    props.bar.images.length;
};

const nextImage = () => {
  if (!props.bar.images || props.bar.images.length === 0) return;
  currentImageIndex.value =
    (currentImageIndex.value + 1) % props.bar.images.length;
};

const setCurrentImage = (index) => {
  if (props.bar.images && index >= 0 && index < props.bar.images.length) {
    currentImageIndex.value = index;
  }
};

const handleImageError = (event) => {
  const target = event.target;
  target.src = defaultImage;
};

const closeModal = () => {
  emit("close");
};

const toggleFavorite = () => {
  // Use place_id for consistency based on BarList and MapView
  if (props.bar.place_id) {
    emit("toggle-wishlist", props.bar.place_id);
  } else if (props.bar.id) {
    // Fallback to id if place_id is not available
    emit("toggle-wishlist", props.bar.id);
  }
};

const goToBarActivities = () => {
  closeModal();
  router.push("/event");
};

function formatReviewDate(unixTime) {
  if (!unixTime) return "";
  const date = new Date(unixTime * 1000);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

const getTagLabel = (tag) => {
  return placeTypeMap?.[tag] || tag;
};
</script>

<style scoped>
.bar-detail-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.bar-detail-modal-content {
  background-color: #fff;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  width: 90%;
  max-width: 900px;
  height: 85vh;
  position: relative;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
}

.content-flex-wrapper {
  display: flex;
  flex-grow: 1;
  overflow: hidden;
}

.close-button {
  position: absolute;
  top: 15px;
  right: 20px;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  transition: all 0.2s ease;
}
.close-button:hover {
  transform: scale(1.1);
  background-color: #fff;
}

.close-button .close-icon {
  width: 20px;
  height: 20px;
  filter: brightness(0.5);
}

.image-gallery-container {
  /* 恢復為圖片一的佈局 */
  width: 50%;
  height: 100%;
  overflow: hidden;
  position: relative;
  background-color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 1.2rem;
  min-height: 200px;
}

.main-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  display: block;
}

.image-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 0 10px;
}

.nav-button {
  background-color: rgba(0, 0, 0, 0.5); /* 恢復圖片一的背景 */
  color: white; /* 恢復圖片一的文字顏色 */
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s; /* 調整過渡效果 */
}
.nav-button:hover {
  background-color: rgba(0, 0, 0, 0.7); /* 恢復圖片一的 hover 背景 */
  transform: scale(1); /* 移除上次加入的 hover 縮放效果 */
}

.image-dots {
  position: absolute;
  bottom: 10px; /* 恢復圖片一的位置 */
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
}

.dot {
  width: 8px;
  height: 8px;
  background-color: rgba(255, 255, 255, 0.6); /* 恢復圖片一的顏色 */
  border-radius: 50%;
  cursor: pointer;
  transition:
    background-color 0.2s,
    transform 0.2s; /* 調整過渡效果 */
}
.dot.active {
  background-color: #fff;
  transform: scale(1.2);
}

.detail-info-section {
  width: 50%; /* 恢復圖片一的寬度 */
  padding: 80px 25px 20px 25px; /* 恢復圖片一的 padding */
  overflow-y: auto;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  padding-bottom: 20px;
  background-color: #f8fafc; /* 與圖片一背景相似 */
}

.header-main {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 10px;
  padding-top: 0; /* 恢復原始 */
}

.bar-detail-name {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  margin: 0;
  line-height: 1.2;
}

.rating-info {
  display: flex;
  align-items: center;
  gap: 15px; /* 恢復圖片一的間距 */
  margin-bottom: 15px;
  font-size: 16px;
  color: #555;
  padding-bottom: 10px; /* 恢復圖片一的間距 */
  border-bottom: 1px solid #f0f0f0; /* 恢復圖片一的邊框 */
}
.rating-text {
  font-weight: 500;
}

.contact-info p {
  margin-bottom: 8px;
  font-size: 15px;
  color: #666; /* 恢復圖片一的顏色 */
  display: flex;
  align-items: center;
  gap: 8px;
}
.contact-info a {
  color: #007bff; /* 恢復圖片一的顏色 */
  text-decoration: none;
}
.contact-info a:hover {
  text-decoration: underline;
}

.opening-hours-detail,
.bar-tags-detail,
.description-section,
.google-review-section {
  margin-top: 20px;
  border-top: 1px solid #eee;
  padding-top: 15px;
}
.opening-hours-detail h3,
.bar-tags-detail h3,
.description-section h3,
.google-review-section h3 {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
}
.opening-hours-detail p,
.description-section p {
  font-size: 15px;
  line-height: 1.6;
  color: #444;
}

.opening-hours-detail ul {
  list-style: none;
  padding: 0;
  margin: 5px 0 0 0;
}
.opening-hours-detail li {
  font-size: 15px;
  color: #444;
  margin-bottom: 3px;
}

.bar-tags-detail .tags-wrapper {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.detail-tag {
  background-color: #e6f7ff; /* 恢復圖片一的顏色 */
  color: #1890ff; /* 恢復圖片一的顏色 */
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  white-space: nowrap;
  border: 1px solid #91d5ff; /* 恢復圖片一的邊框 */
}

.google-review-section {
  padding-bottom: 15px;
}

.review-card {
  background-color: #f9f9f9; /* 恢復圖片一的背景 */
  border-radius: 8px;
  padding: 15px;
  margin-top: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: none; /* 恢復圖片一的無邊框 */
}

.review-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 10px;
  border: 1px solid #ddd;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: bold;
  color: #333;
  font-size: 16px;
}

.review-date {
  font-size: 13px;
  color: #777;
}

.review-text {
  font-size: 15px;
  line-height: 1.6;
  color: #444;
  margin-bottom: 10px;
}

.review-actions {
  display: flex;
  gap: 15px;
  font-size: 14px;
  color: #888;
}

.footer-actions {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: space-between; /* 內容兩端對齊 */
  align-items: center;
  padding: 15px 25px;
  background-color: #fff;
  border-top: 1px solid #f0f0f0; /* 恢復圖片一的邊框 */
  box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.05);
  z-index: 5;
  box-sizing: border-box;
}

.action-buttons-group {
  display: flex;
  gap: 15px; /* 恢復圖片一的間距 */
}

.action-button {
  background: none;
  border: 1px solid #e2e8f0; /* 恢復圖片一的邊框 */
  border-radius: 12px; /* 恢復圖片一的圓角 */
  width: 44px; /* 恢復圖片一的大小 */
  height: 44px; /* 恢復圖片一的大小 */
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;
  background-color: #fff;
}

.action-button:hover {
  background-color: #f7fafc;
  border-color: #cbd5e0;
  transform: translateY(-2px); /* 恢復圖片一的 hover 效果 */
}

.action-button .icon {
  width: 24px;
  height: 24px;
  filter: brightness(0.5); /* 恢復圖片一的濾鏡 */
}

.wishlist-detail-button .heart-icon {
  width: 20px; /* 恢復圖片一的大小 */
  height: 20px; /* 恢復圖片一的大小 */
  transition:
    fill 0.3s ease,
    stroke 0.3s ease;
}
/* 恢復圖片一的收藏按鈕 hover 效果 */
.wishlist-detail-button:not([fill="red"]):hover .heart-icon {
  fill: #ffebeb;
  stroke: red;
}

.start-event-button {
  /* 恢復圖片一的樣式 */
  background-image: linear-gradient(to right, #a8d87b, #d8dbaf, #daa258);
  color: #333;
  border: none;
  border-radius: 25px;
  padding: 10px 20px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.start-event-button:hover {
  transform: scale(1.05);
  filter: brightness(1.1);
  box-shadow: 0 6px 10px rgba(0, 0, 0, 0.15);
}

.icon-plus {
  width: 20px;
  height: 20px;
}

.icon-plus {
  margin-left: -4px;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* Tooltip 樣式恢復 */
.action-button[data-tooltip] {
  position: relative;
}
.action-button[data-tooltip]:hover::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 110%;
  left: 50%;
  transform: translateX(-50%);
  background: #333;
  color: #fff;
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 13px;
  white-space: nowrap;
  z-index: 20;
  opacity: 1;
  pointer-events: none;
  transition: opacity 0.2s;
}
.action-button[data-tooltip]::after {
  opacity: 0;
  pointer-events: none;
}

@media (max-width: 768px) {
  .bar-detail-modal-content {
    flex-direction: column;
    width: 95%;
    max-width: 95%;
    height: 95vh;
    border-radius: 8px;
  }
  .content-flex-wrapper {
    flex-direction: column;
  }
  .image-gallery-container {
    width: 100%;
    height: 250px;
  }
  .detail-info-section {
    width: 100%;
    padding: 20px 15px;
    padding-bottom: calc(20px + 60px + 10px);
  }
  .bar-detail-name {
    font-size: 24px;
  }
  .rating-info {
    font-size: 14px;
  }
  .close-button {
    top: 10px;
    right: 10px;
    width: 32px;
    height: 32px;
  }

  .close-button .close-icon {
    width: 18px;
    height: 18px;
  }

  .wishlist-detail-button .heart-icon {
    width: 20px;
    height: 20px;
  }

  .footer-actions {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    padding: 10px 15px;
    box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.1);
    border-top: none;
  }
  .action-buttons-group {
    gap: 10px;
  }
  .action-button {
    width: 36px;
    height: 36px;
    border-radius: 10px;
  }
  .action-button .icon {
    width: 20px;
    height: 20px;
  }
  .start-event-button {
    padding: 8px 15px;
    font-size: 15px;
  }

  .icon-plus {
    width: 18px;
    height: 18px;
  }
}
</style>
