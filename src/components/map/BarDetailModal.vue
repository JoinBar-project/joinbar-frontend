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

        <div class="content-flex-wrapper">
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
                  viewBox="0 0 24 24"
                  :fill="bar.isWishlisted ? 'red' : 'white'"
                  :stroke="bar.isWishlisted ? 'red' : '#7f7f7f'" stroke-width="1.5"
                  class="heart-icon"
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
                    <span class="user-name">新用戶</span>
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
              <div class="review-card">
                <div class="review-header">
                  <img
                    src="https://via.placeholder.com/40"
                    alt="User Avatar"
                    class="user-avatar"
                  />
                  <div class="user-info">
                    <span class="user-name">另一個用戶</span>
                    <span class="review-date">2024年05月18日</span>
                  </div>
                </div>
                <p class="review-text">
                  非常棒的體驗，服務人員態度親切，酒水品質一流！夜晚氛圍感十足，是放鬆的好去處。
                </p>
                <div class="review-actions">
                  <span>👍 有用 (5)</span>
                  <span>👎 不喜歡 (0)</span>
                </div>
              </div>
              <div class="review-card">
                <div class="review-header">
                  <img
                    src="https://via.placeholder.com/40"
                    alt="User Avatar"
                    class="user-avatar"
                  />
                  <div class="user-info">
                    <span class="user-name">常造訪用戶</span>
                    <span class="review-date">2024年05月15日</span>
                  </div>
                </div>
                <p class="review-text">
                  信義區的夜景真的無敵，這裡的視野很棒。調酒有創意，但價格偏高一些。整體還是很值得一去。
                </p>
                <div class="review-actions">
                  <span>👍 有用 (7)</span>
                  <span>👎 不喜歡 (1)</span>
                </div>
              </div>
              <div class="review-card">
                <div class="review-header">
                  <img
                    src="https://via.placeholder.com/40"
                    alt="User Avatar"
                    class="user-avatar"
                  />
                  <div class="user-info">
                    <span class="user-name">老顧客</span>
                    <span class="review-date">2024年05月10日</span>
                  </div>
                </div>
                <p class="review-text">
                  每次來都有驚喜，特別喜歡他們家的季節限定調酒。服務生會主動詢問口味偏好，很貼心。
                </p>
                <div class="review-actions">
                  <span>👍 有用 (12)</span>
                  <span>👎 不喜歡 (0)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="footer-actions">
          <div class="icon-buttons">
            <button class="action-icon-button upload-photo-button" @click="triggerFileUpload">
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
                src="@/assets/icons/mapicons/navigation-icon.svg" alt="導航"
                class="icon"
              />
            </button>
          </div>
          <button class="add-to-trip-button" @click="goToBarActivities">
            發起活動
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
  </transition>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import type { PropType } from "vue";
import { useRouter } from 'vue-router';

interface Bar {
  id?: string;
  place_id?: string;
  name: string;
  imageUrl?: string;
  images?: string[];
  rating?: number;
  reviews?: number;
  priceRange?: string;
  tags?: string[];
  types?: string[];
  openingHours?: google.maps.places.OpeningHours | { weekday_text?: string[] };
  location?: { lat: number; lng: number };
  description?: string;
  isWishlisted?: boolean; // 確保此屬性存在並能被外部更新
  address?: string;
  phone?: string;
  website?: string;
}

const props = defineProps({
  bar: {
    type: Object as PropType<Bar>,
    required: true,
  },
});

const emit = defineEmits(["close", "toggle-wishlist"]);

const router = useRouter();

const currentImageIndex = ref(0);
const defaultImage = "https://placehold.co/800x600/decdd5/860914?text=No+Image+Available";

const currentImage = computed(() => {
  if (props.bar.images && props.bar.images.length > 0) {
    return props.bar.images[currentImageIndex.value];
  }
  return props.bar.imageUrl || defaultImage;
});

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

const setCurrentImage = (index: number) => {
  if (props.bar.images && index >= 0 && index < props.bar.images.length) {
    currentImageIndex.value = index;
  }
};

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement;
  target.src = defaultImage;
};

const closeModal = () => {
  emit("close");
};

// 這裡的 toggleFavorite 會向父組件發送事件，父組件應該更新 bar.isWishlisted
const toggleFavorite = () => {
  if (props.bar.place_id) {
    emit("toggle-wishlist", props.bar.place_id);
  } else if (props.bar.id) {
    emit("toggle-wishlist", props.bar.id);
  }
};

const goToBarActivities = () => {
  closeModal();
  router.push('/events');
};

const fileInput = ref<HTMLInputElement | null>(null);

const triggerFileUpload = () => {
  fileInput.value?.click();
};

const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;

  if (files && files.length > 0) {
    const selectedFile = files[0];
    console.log("Selected file for upload:", selectedFile);

    alert(`選取了檔案：${selectedFile.name} (大小: ${selectedFile.size} bytes)\n此處僅為前端選取示範，實際圖片上傳需連接後端。`);

    if (fileInput.value) {
      fileInput.value.value = '';
    }
  }
};
</script>

<style scoped>
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
  display: flex; /* 設置為 flex 容器 */
  flex-direction: column; /* 內容垂直排列 (header, content, footer) */
  width: 90%;
  max-width: 900px;
  height: 85vh;
  position: relative; /* 確保內部絕對定位的按鈕參考此容器 */
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
}

/* 包裹左右兩側主要內容的 flex 容器 */
.content-flex-wrapper {
  display: flex;
  flex-grow: 1; /* 讓此容器佔用 bar-detail-modal-content 內的所有剩餘垂直空間 */
  overflow: hidden; /* 防止內部滾動條溢出此容器 */
}

/* 關閉按鈕 */
.close-button {
  position: absolute;
  top: 15px; /* 距離 modal 容器頂部 */
  right: 15px; /* 距離 modal 容器右側 */
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
  height: 100%; /* 佔用 content-flex-wrapper 的高度 */
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
  transition: background-color 0.2s, transform 0.2s;
}
.dot.active {
  background-color: #fff;
  transform: scale(1.2);
}

/* 右側：詳細資訊區塊 */
.detail-info-section {
  width: 50%;
  padding: 80px 25px 20px 25px; /* 上 右 下 左，80px 是為頂部空白區預留 */
  overflow-y: auto; /* 關鍵：允許此區塊內容滾動 */
  flex-grow: 1; /* 讓此區塊在 content-flex-wrapper 中佔用剩餘的所有垂直空間 */
  display: flex;
  flex-direction: column;
  padding-bottom: calc(20px + 60px + 15px); /* 增加底部內邊距，為固定在 Modal 底部的 footer-actions 留出空間 */
}

/* 標題與愛心按鈕的 flex 容器 */
.header-main {
  display: flex;
  align-items: center; /* 垂直居中對齊 */
  justify-content: flex-start; /* 保持左側對齊 */
  margin-bottom: 10px;
}

.bar-detail-name {
  font-size: 28px;
  font-weight: bold;
  color: #333;
  margin: 0;
  line-height: 1.2;
  margin-right: 15px; /* 為愛心按鈕留出空間 */
}

/* 愛心收藏按鈕新樣式 */
.wishlist-detail-button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: 10;
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px; /* 設置固定寬高 */
  height: 32px;
  transition: transform 0.2s ease-in-out; /* 懸停時的縮放動畫 */
}
.wishlist-detail-button:hover {
  transform: scale(1.1);
}

/* 愛心 SVG 圖標樣式 */
.wishlist-detail-button .heart-icon {
  width: 32px; /* 確保 SVG 尺寸與按鈕一致 */
  height: 32px;
  /* 過渡效果讓愛心顏色切換更平滑 */
  transition: fill 0.3s ease, stroke 0.3s ease;
}

/* 當滑鼠懸停在按鈕上且未收藏時，SVG 的顏色變為 red-400 的效果 */
.wishlist-detail-button:not([fill='red']):hover .heart-icon {
/* 假設現在是未收藏狀態，我們會看到白底黑邊。
     Hover 時我們希望看到淺紅底紅邊。 */
     fill: #ffebeb; /* 淺紅色背景效果 */
     stroke: red; /* 懸停時邊框變紅 */
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

/* 底部操作按鈕容器 - 固定在 bar-detail-modal-content 底部 */
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
  background-color: #d4624e;
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
  background-color: #860914;
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
  .content-flex-wrapper {
    flex-direction: column; /* 手機版堆疊 */
  }
  .image-gallery-container {
    width: 100%;
    height: 250px;
  }
  .detail-info-section {
    width: 100%;
    padding: 60px 15px 20px 15px; /* 調整手機版頂部內邊距 */
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
  .close-button svg {
    width: 20px;
    height: 20px;
  }
  /* 手機版愛心收藏按鈕位置調整 */
  .wishlist-detail-button {
    margin-left: 10px;
  }
  .wishlist-detail-button .heart-icon {
    width: 20px;
    height: 20px;
  }
  /* 手機版 footer-actions 調整 */
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
  .add-to-trip-button {
    padding: 8px 15px;
    font-size: 15px;
  }
  .icon-dropdown,
  .icon-plus {
    width: 18px;
    height: 18px;
  }
}
</style>