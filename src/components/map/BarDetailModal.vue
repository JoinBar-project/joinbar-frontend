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
                >{{ getTagLabel(tag) }}</span>
              </div>
            </div>

            <div class="description-section">
              <h3>酒吧介紹</h3>
              <p>{{ bar.description || "暫無詳細介紹。" }}</p>
            </div>

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
                    <span>👎 不喜歡 ({{ review.rating || 0 }})</span>
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
              data-tooltip="上傳照片"
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

            <button class="action-icon-button share-button" data-tooltip="分享" @click="showShareModal">
              <img
                src="@/assets/icons/mapicons/share-icon.svg"
                alt="分享"
                class="icon"
              />
            </button>
            <button class="action-icon-button navigate-button" data-tooltip="導航" @click="() => navigateToBar(bar)">
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
              :data-tooltip="bar.isWishlisted ? '取消收藏' : '加入收藏'"
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

  <div 
        v-if="shareModalVisible" 
        class="share-modal-overlay w-screen h-screen fixed inset-0 flex justify-center items-center z-2000" 
        @click.self="closeShareModal">
    <div class="bg-white rounded-2xl w-80 shadow-xl overflow-hidden">
      <div class="flex justify-between items-center px-6 py-5 border-b border-gray-100 text-black">
        <h3 text-lg font-bold text-gray-800>分享</h3>
        <button 
          class="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-black hover:text-gray-600 transition-colors" 
          @click="closeShareModal">×</button>
      </div>

      <div class="flex justify-center gap-5 px-6 py-5">
        <!-- Line -->
        <button 
          class="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-gray-50 transition-colors min-w-20" 
          @click="shareToLine">
          <div class="w-15 h-15 bg-green-500 rounded-full flex items-center justify-center">
            <svg
              aria-label="Line logo"
              width="24"
              height="24"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
            >
              <g fill-rule="evenodd" stroke-linejoin="round" fill="white">
                <path
                  fill-rule="nonzero"
                  d="M12.91 6.57c.232 0 .42.19.42.42 0 .23-.188.42-.42.42h-1.17v.75h1.17a.42.42 0 1 1 0 .84h-1.59a.42.42 0 0 1-.418-.42V5.4c0-.23.188-.42.42-.42h1.59a.42.42 0 0 1-.002.84h-1.17v.75h1.17zm-2.57 2.01a.421.421 0 0 1-.757.251l-1.63-2.217V8.58a.42.42 0 0 1-.42.42.42.42 0 0 1-.418-.42V5.4a.418.418 0 0 1 .755-.249L9.5 7.366V5.4c0-.23.188-.42.42-.42.23 0 .42.19.42.42v3.18zm-3.828 0c0 .23-.188.42-.42.42a.42.42 0 0 1-.418-.42V5.4c0-.23.188-.42.42-.42.23 0 .418.19.418.42v3.18zM4.868 9h-1.59c-.23 0-.42-.19-.42-.42V5.4c0-.23.19-.42.42-.42.232 0 .42.19.42.42v2.76h1.17a.42.42 0 1 1 0 .84M16 6.87C16 3.29 12.41.376 8 .376S0 3.29 0 6.87c0 3.208 2.846 5.896 6.69 6.405.26.056.615.172.705.394.08.2.053.518.026.722 0 0-.092.565-.113.685-.035.203-.16.79.693.432.854-.36 4.607-2.714 6.285-4.646C15.445 9.594 16 8.302 16 6.87"
                ></path>
              </g>
            </svg>
          </div>
          <span class="text-sm font-medium text-gray-700">Line</span>
        </button>
      </div>

      <!-- 網址預覽 -->
      <div class="bg-gray-50 px-6 py-4 border-t border-gray-100 flex gap-2 items-center">
        <input 
          type="text" 
          :value="shareUrl" 
          readonly 
          class="flex-1 px-3 py-2 border border-gray-200 rounded-md text-xs text-gray-600 bg-white focus:outline-none focus:border-blue-500"
          ref="urlInput"
        />
        <button class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap" @click="copyUrl">複製</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import { useRouter } from "vue-router";
import placeTypeMap from '@/composables/placeTypeMap';
import { navigateToBar } from '@/utils/useGoogleMapNavigation';

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

const google = computed(() => window.google && window.google.maps ? window.google.maps : null);

const currentImage = computed(() => {
  if (props.bar.images && props.bar.images.length > 0) {
    return props.bar.images[currentImageIndex.value];
  }
  return props.bar.imageUrl || defaultImage;
});

const currentOpenStatus = computed(() => {
  if (props.bar.opening_hours && google.value) {
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
  if (props.bar.placeId) {
    emit("toggle-wishlist", props.bar.placeId);
  } else if (props.bar.id) {
    emit("toggle-wishlist", props.bar.id);
  }
};

const goToBarActivities = () => {
  closeModal();
  router.push("/event");
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

const getTagLabel = (tag) => {
  return placeTypeMap[tag] || tag;
};

// 分享
const shareModalVisible = ref(false);
const urlInput = ref(null);

const showShareModal = () => {
  shareModalVisible.value = true;
};

const closeShareModal = () => {
  shareModalVisible.value = false;
};

const shareUrl = computed(() => {
  return props.bar.url;
});

const copyUrl = async () => {
  try {
    await navigator.clipboard.writeText(shareUrl.value);
    alert('網址已複製到剪貼簿！');
  } catch (error) {
    alert('複製失敗，請手動複製網址');
  }
};

const shareToLine = () => {
  try {
    const barName = props.bar.name;
    const barRating = props.bar.rating || 'N/A';
    const barAddress = props.bar.address || '';
    
    const shareText = `推薦酒吧：${barName}\n評價：${barRating}星\n${barAddress}`;
    
    const lineShareUrl = `https://social-plugins.line.me/lineit/share?` +
                          `url=${encodeURIComponent(shareUrl.value)}&` +
                          `text=${encodeURIComponent(shareText)}`;
    
    const lineWindow = window.open(lineShareUrl, 'lineShare', 'width=600,height=500');
    
    if (lineWindow) {
      closeShareModal();
    }
    
  } catch (error) {
    console.error('Line 分享失敗:', error);
    alert('Line 分享失敗，請稍後再試');
  }
};
console.log('=== 酒吧 Props 內容 ===');
console.log(props.bar);
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

.share-modal-overlay {
  background-color: rgba(0, 0, 0, 0.5);
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

.action-icon-button[data-tooltip] {
  position: relative;
}
.action-icon-button[data-tooltip]:hover::after {
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
.action-icon-button[data-tooltip]::after {
  opacity: 0;
  pointer-events: none;
}
</style>