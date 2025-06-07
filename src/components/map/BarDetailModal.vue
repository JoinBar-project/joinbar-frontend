<template>
  <transition name="modal-fade">
    <div class="bar-detail-modal-overlay" @click.self="closeModal">
      <div class="bar-detail-modal-content">
        <button class="close-button" @click="closeModal">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            class="w-6 h-6"
          >
            <path
              fill-rule="evenodd"
              d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.70 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z"
              clip-rule="evenodd"
            />
          </svg>
        </button>

        <div class="image-gallery-container">
          <img
            :src="currentImage"
            alt="Bar Image"
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
            <button
              class="wishlist-detail-button"
              @click.stop="toggleFavorite"
              :aria-label="bar.isWishlisted ? '取消收藏' : '加入收藏'"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-8 h-8"
                :fill="bar.isWishlisted ? 'red' : '#fff'"
                viewBox="0 0 24 24"
                stroke="none"
              >
                <path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                />
              </svg>
            </button>
          </div>

          <div class="rating-price-info">
            <span class="rating-text"
              >⭐️ {{ bar.rating || "N/A" }} ({{ bar.reviews || 0 }} 評論)</span
            >
            <span class="price-range">NT$ {{ bar.priceRange || "???" }}</span>
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
              {{ bar.openingHours?.weekday_text?.[0] || "未提供營業時間" }}
            </p>
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

          <div class="fake-review-section">
            <h3>熱門評論</h3>
            <div class="review-card">
              <div class="review-header">
                <img
                  src="https://via.placeholder.com/40"
                  alt="User Avatar"
                  class="user-avatar"
                />
                <div class="user-info">
                  <span class="user-name">示例用戶</span>
                  <span class="review-date">2024年05月20日</span>
                </div>
              </div>
              <p class="review-text">
                這家酒吧氛圍超好，調酒師也很專業，推薦他們的招牌特調！會再來！
              </p>
              <div class="review-actions">
                <span>👍 有用 (10)</span>
                <span>👎 不喜歡 (0)</span>
              </div>
            </div>
          </div>

          <div class="footer-actions">
            <div class="icon-buttons">
              <button class="action-icon-button share-button">
                <img
                  src="@/assets/icons/mapicons/share-icon.svg"
                  alt="分享"
                  class="icon"
                />
              </button>
              <button class="action-icon-button favorite-button" @click="toggleFavorite">
                <img
                  :src="bar.isWishlisted ? getIconUrl('heart-filled-icon.svg') : getIconUrl('heart-icon.svg')"
                  alt="收藏"
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
            </div>
            <button class="add-to-trip-button">
              加入行程
              <img
                src="@/assets/icons/mapicons/dropdown-arrow-icon.svg"
                alt="下拉"
                class="icon-dropdown"
              />
              <img
                src="@/assets/icons/mapicons/plus-icon.svg"
                alt="加號"
                class="icon-plus"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch, computed } from 'vue';

// 刪除了 TypeScript 的類型定義
// interface Bar { ... }

const props = defineProps({
  bar: {
    type: Object, // 移除了 PropType<Bar>
    required: true,
  },
});

const emit = defineEmits(['close', 'toggle-wishlist']);

const currentImageIndex = ref(0);
const defaultImage = "https://placehold.co/800x600/decdd5/860914?text=No+Image+Available";

const currentImage = computed(() => {
  if (props.bar.images && props.bar.images.length > 0) {
    return props.bar.images[currentImageIndex.value];
  }
  return props.bar.imageUrl || defaultImage;
});

// Helper function to dynamically get icon URLs (純 JS 格式)
const getIconUrl = (iconName) => {
  // 路徑已更新為 src/assets/icons/mapicons/
  return new URL(`../assets/icons/mapicons/${iconName}`, import.meta.url).href;
};

watch(
  () => props.bar,
  () => {
    currentImageIndex.value = 0;
  },
  { immediate: true },
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
  emit('close');
};

const toggleFavorite = () => {
  if (props.bar.place_id) {
    emit('toggle-wishlist', props.bar.place_id);
  } else if (props.bar.id) {
    emit('toggle-wishlist', props.bar.id);
  }
};
</script>

<style scoped>
/* CSS 樣式與之前版本相同，無需修改 */

/* Modal 遮罩層 */
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

/* Modal 內容區塊 */
.bar-detail-modal-content {
  background-color: #fff;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  width: 90%;
  max-width: 900px;
  height: 85vh;
  position: relative;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
}

/* 關閉按鈕 */
.close-button {
  position: absolute;
  top: 15px;
  right: 15px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: background-color 0.2s;
}
.close-button:hover {
  background-color: rgba(0, 0, 0, 0.7);
}
.close-button svg {
  width: 24px;
  height: 24px;
}

/* 左側：圖片輪播區 */
.image-gallery-container {
  width: 50%;
  height: 100%;
  overflow: hidden;
  position: relative;
  background-color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
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
  transition: background-color 0.2s, transform 0.2s;
}
.dot.active {
  background-color: #fff;
  transform: scale(1.2);
}

/* 右側：詳細資訊區塊 */
.detail-info-section {
  width: 50%;
  padding: 20px 25px;
  overflow-y: auto;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  padding-bottom: 80px; /* 為底部 sticky 按鈕留出空間 */
  position: relative;
}

.header-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: transform 0.2s;
}
.wishlist-detail-button:hover {
  transform: scale(1.1);
}
.wishlist-detail-button svg {
  filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.3));
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
.price-range {
  font-weight: 600;
  color: #d9534f;
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
.fake-review-section {
  margin-top: 20px;
  border-top: 1px solid #eee;
  padding-top: 15px;
}
.opening-hours-detail h3,
.bar-tags-detail h3,
.description-section h3,
.fake-review-section h3 {
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

.fake-review-section {
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

/* 底部操作按鈕容器 */
.footer-actions {
  position: sticky;
  bottom: -80px; /* 根據你的實際測試結果調整 */
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: #fff;
  border-top: 1px solid #eee;
  box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.05);
  margin-top: auto;
  z-index: 5;
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
  transition: background-color 0.2s, border-color 0.2s;
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

.add-to-trip-button {
  background-color: #ff9800;
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

.add-to-trip-button:hover {
  background-color: #fb8c00;
}

.icon-dropdown,
.icon-plus {
  width: 20px;
  height: 20px;
}

.icon-plus {
  margin-left: -4px;
}

/* Modal 淡入淡出過渡效果 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* 響應式調整 */
@media (max-width: 768px) {
  .bar-detail-modal-content {
    flex-direction: column;
    width: 95%;
    max-width: 95%;
    height: 95vh;
    border-radius: 8px;
  }
  .image-gallery-container {
    width: 100%;
    height: 250px;
  }
  .detail-info-section {
    width: 100%;
    padding: 15px;
    padding-bottom: 70px;
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
  .close-button svg {
    width: 20px;
    height: 20px;
  }
  .footer-actions {
    position: sticky;
    bottom: -15px;
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
  .add-to-trip-button {
    padding: 8px 15px;
    font-size: 15px;
  }
  .add-to-trip-button .icon-dropdown,
  .add-to-trip-button .icon-plus {
    width: 18px;
    height: 18px;
  }
}
</style>