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

            <div class="rating-price-info">
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
                  >{{ tag }}</span
                >
              </div>
            </div>

            <div class="description-section">
              <h3>酒吧介紹</h3>
              <p>{{ bar.description || "暫無詳細介紹。" }}</p>
            </div>

            <!-- 動態 Google 評論區塊 -->
            <div class="google-review-section">
              <h3>熱門評論</h3>
              <template v-if="bar.googleReviews && bar.googleReviews.length">
                <div class="review-card" v-for="(review, idx) in bar.googleReviews.slice(0, 5)" :key="idx">
                  <div class="review-header">
                    <img :src="review.profile_photo_url || 'https://via.placeholder.com/40'" alt="User Avatar" class="user-avatar" />
                    <div class="user-info">
                      <span class="user-name">{{ review.author_name || '匿名用戶' }}</span>
                      <span class="review-date">{{ formatReviewDate(review.time) }}</span>
                    </div>
                  </div>
                  <p class="review-text">{{ review.text }}</p>
                  <div class="review-actions">
                    <span>👍 有用 ({{ review.rating || 0 }})</span>
                  </div>
                </div>
              </template>
              <p v-else>暫無 Google 評論</p>
            </div>
          </div>
        </div>

        <div class="footer-actions">
          <div class="icon-buttons">
            <button
              class="action-icon-button upload-photo-button"
              @click="triggerFileUpload"
            >
              <img
                src="@/assets/icons/mapicons/add-photo-icon.svg"
                alt="新增照片"
                class="icon"
              />
            </button>
            <input
              type="file"
              ref="fileInput"
              style="display: none"
              accept="image/*"
              @change="handleFileUpload"
            />

            <button class="action-icon-button share-button">
              <img
                src="@/assets/icons/mapicons/share-icon.svg"
                alt="分享"
                class="icon"
              />
            </button>
            <button class="action-icon-button navigate-button">
              <img
                src="@/assets/icons/mapicons/navigation-icon.svg"
                alt="導航"
                class="icon"
              />
            </button>
            <button
              class="action-icon-button wishlist-detail-button"
              @click.stop="toggleFavorite"
              :aria-label="bar.isWishlisted ? '取消收藏' : '加入收藏'"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                :fill="bar.isWishlisted ? 'red' : 'white'"
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

// 直接使用 window.google，因為 Google Maps API 已經載入到全域
const google = computed(() => window.google && window.google.maps ? window.google.maps : null);

const currentImage = computed(() => {
  if (props.bar.images && props.bar.images.length > 0) {
    return props.bar.images[currentImageIndex.value];
  }
  return props.bar.imageUrl || defaultImage;
});

// 計算屬性用於判斷當前營業狀態
const currentOpenStatus = computed(() => {
  if (props.bar.opening_hours && google.value) {
    // 確保 google 物件已載入且 opening_hours 存在
    return props.bar.opening_hours.isOpen()
      ? '<span style="color: green;">正在營業中</span>'
      : '<span style="color: red;">目前休息中</span>';
  }
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
  if (props.bar.place_id) {
    emit("toggle-wishlist", props.bar.place_id);
  } else if (props.bar.id) {
    emit("toggle-wishlist", props.bar.id);
  }
};

const goToBarActivities = () => {
  closeModal();
  router.push("/events");
};

const fileInput = ref(null);

const triggerFileUpload = () => {
  fileInput.value?.click();
};

const handleFileUpload = (event) => {
  const target = event.target;
  const files = target.files;

  if (files && files.length > 0) {
    const selectedFile = files[0];
    console.log("Selected file for upload:", selectedFile);

    alert(
      `選取了檔案：${selectedFile.name} (大小: ${selectedFile.size} bytes)\n此處僅為前端選取示範，實際圖片上傳需連接後端。`
    );

    if (fileInput.value) {
      fileInput.value.value = "";
    }
  }
};

function formatReviewDate(unixTime) {
  if (!unixTime) return '';
  const date = new Date(unixTime * 1000);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}
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
}
.close-button:hover {
  transform: scale(1.1);
}

.close-button .close-icon {
  width: 100%;
  height: 100%;
}

.image-gallery-container {
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
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}
.nav-button:hover {
  background-color: rgba(0, 0, 0, 0.7);
}

.image-dots {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
}

.dot {
  width: 8px;
  height: 8px;
  background-color: rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  cursor: pointer;
  transition:
    background-color 0.2s,
    transform 0.2s;
}
.dot.active {
  background-color: #fff;
  transform: scale(1.2);
}

.detail-info-section {
  width: 50%;
  padding: 80px 25px 20px 25px;
  overflow-y: auto;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  padding-bottom: calc(20px + 60px + 15px);
}

.header-main {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 10px;
}

.bar-detail-name {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  margin: 0;
  line-height: 1.2;
}

.wishlist-detail-button {
  cursor: pointer;
  z-index: 10;
  outline: none;
  transition: transform 0.2s ease-in-out;
}

.wishlist-detail-button:hover {
  transform: scale(1.1);
}

.wishlist-detail-button .heart-icon {
  width: 24px;
  height: 24px;
  transition:
    fill 0.3s ease,
    stroke 0.3s ease;
}

.wishlist-detail-button:not([fill="red"]):hover .heart-icon {
  fill: #ffebeb;
  stroke: red;
}

.rating-price-info {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
  font-size: 16px;
  color: #555;
}
.rating-text {
  font-weight: 500;
}

.contact-info p {
  margin-bottom: 8px;
  font-size: 15px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 8px;
}
.contact-info a {
  color: #007bff;
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
/* 新增或修改 ul/li 樣式 */
.opening-hours-detail ul {
  list-style: none; /* 移除預設的列表樣式 */
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
  background-color: #e6f7ff;
  color: #1890ff;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  white-space: nowrap;
  border: 1px solid #91d5ff;
}

.google-review-section {
  padding-bottom: 15px;
}

.review-card {
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 15px;
  margin-top: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
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
  left: 50%;
  width: 50%;
  transform: translateX(0%);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 25px;
  background-color: #fff;
  border-top: 1px solid #eee;
  box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.05);
  z-index: 5;
  box-sizing: border-box;
}

.icon-buttons {
  display: flex;
  gap: 15px;
}

.action-icon-button {
  background: none;
  border: 1px solid #ccc;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    background-color 0.2s,
    border-color 0.2s;
  padding: 0;
}

.action-icon-button:hover {
  background-color: #f0f0f0;
  border-color: #aaa;
}

.action-icon-button .icon {
  width: 24px;
  height: 24px;
}

.start-event-button {
  background-color: #daa258;
  color: white;
  border: none;
  border-radius: 25px;
  padding: 10px 20px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s;
}

.start-event-button:hover {
  background-color: #c37b1c;
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
    padding: 60px 15px 20px 15px;
    padding-bottom: calc(20px + 60px + 10px);
  }
  .bar-detail-name {
    font-size: 24px;
  }
  .rating-price-info {
    font-size: 14px;
  }
  .close-button {
    top: 10px;
    right: 10px;
    width: 32px;
    height: 32px;
  }

  .close-button .close-icon {
    width: 100%;
    height: 100%;
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
  .icon-buttons {
    gap: 10px;
  }
  .action-icon-button {
    width: 36px;
    height: 36px;
  }
  .action-icon-button .icon {
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
