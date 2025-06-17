<template>
  <transition name="modal-fade">
    <div class="bar-detail-modal-overlay" @click.self="handleClose">
      <div class="bar-detail-modal-content">
        <button class="close-button" @click="handleClose">
          <img src="@/assets/icons/mapicons/close-button.svg" alt="關閉" class="icon close-icon" />
        </button>

        <div class="content-flex-wrapper">
          <div class="image-gallery-container">
            <img
              :src="currentImage"
              alt="Bar Image"
              class="main-image"
              @error="handleImageError"
            />
            <div v-if="bar.images?.length > 1" class="image-nav">
              <button class="nav-button prev-button" @click="prevImage">&lt;</button>
              <button class="nav-button next-button" @click="nextImage">&gt;</button>
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
            <h2 class="bar-detail-name">{{ bar.name }}</h2>
            <div class="rating-price-info">
              <span>⭐️ {{ bar.rating || "N/A" }} ({{ bar.reviews || 0 }} 評論)</span>
              <span class="price-range">NT$ {{ bar.priceRange || "???" }}</span>
            </div>

            <div class="contact-info">
              <p v-if="bar.address">📍 {{ bar.address }}</p>
              <p v-if="bar.phone">📞 {{ bar.phone }}</p>
              <p v-if="bar.website">
                🌐 <a :href="bar.website" target="_blank">{{ bar.website }}</a>
              </p>
            </div>

            <div class="opening-hours-detail">
              <h3>營業時間</h3>
              <p>{{ bar.openingHours?.weekday_text?.[0] || "未提供營業時間" }}</p>
            </div>

            <div v-if="bar.tags?.length" class="bar-tags-detail">
              <h3>特色標籤</h3>
              <div class="tags-wrapper">
                <span v-for="(tag, index) in bar.tags" :key="index" class="detail-tag">{{ tag }}</span>
              </div>
            </div>

            <div class="description-section">
              <h3>酒吧介紹</h3>
              <p>{{ bar.description || "暫無詳細介紹。" }}</p>
            </div>

            <div class="fake-review-section">
              <h3>熱門評論</h3>
              <div v-for="(review, index) in mockReviews" :key="index" class="review-card">
                <div class="review-header">
                  <img :src="review.avatar" alt="User Avatar" class="user-avatar" />
                  <div class="user-info">
                    <span class="user-name">{{ review.name }}</span>
                    <span class="review-date">{{ review.date }}</span>
                  </div>
                </div>
                <p class="review-text">{{ review.text }}</p>
                <div class="review-actions">
                  <span>👍 有用 ({{ review.up }})</span>
                  <span>👎 不喜歡 ({{ review.down }})</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="footer-actions">
          <div class="icon-buttons">
            <button class="action-icon-button upload-photo-button" @click="triggerFileUpload">
              <img src="@/assets/icons/mapicons/add-photo-icon.svg" alt="新增照片" class="icon" />
            </button>
            <input
              type="file"
              ref="fileInput"
              style="display: none"
              accept="image/*"
              @change="handleFileUpload"
            />

            <button class="action-icon-button share-button">
              <img src="@/assets/icons/mapicons/share-icon.svg" alt="分享" class="icon" />
            </button>

            <button class="action-icon-button navigate-button">
              <img src="@/assets/icons/mapicons/navigation-icon.svg" alt="導航" class="icon" />
            </button>

            <button
              class="action-icon-button wishlist-detail-button"
              @click.stop="toggleFavorite"
              :aria-label="localIsWishlisted ? '取消收藏' : '加入收藏'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" :fill="localIsWishlisted ? 'red' : 'white'" :stroke="localIsWishlisted ? 'red' : '#7f7f7f'" stroke-width="1.5" class="heart-icon">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </button>
          </div>

          <button class="start-event-button" @click="goToBarActivities">
            發起活動
            <img src="@/assets/icons/mapicons/plus-icon.svg" alt="加號" class="icon-plus" />
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({ bar: Object })
const emit = defineEmits(['close', 'toggle-wishlist'])
const router = useRouter()

// 圖片切換邏輯
const currentImageIndex = ref(0)
const defaultImage = 'https://placehold.co/800x600/decdd5/860914?text=No+Image'
const currentImage = computed(() => {
  return props.bar.images?.[currentImageIndex.value] || props.bar.imageUrl || defaultImage
})
const prevImage = () => {
  if (!props.bar.images?.length) return
  currentImageIndex.value = (currentImageIndex.value - 1 + props.bar.images.length) % props.bar.images.length
}
const nextImage = () => {
  if (!props.bar.images?.length) return
  currentImageIndex.value = (currentImageIndex.value + 1) % props.bar.images.length
}
const setCurrentImage = (index) => {
  if (index >= 0 && index < props.bar.images.length) {
    currentImageIndex.value = index
  }
}
const handleImageError = (e) => {
  e.target.src = defaultImage
}

// 收藏愛心狀態（local，變動 emit 出去）
const localIsWishlisted = ref(false)
watch(
  () => props.bar,
  () => {
    currentImageIndex.value = 0
    localIsWishlisted.value = props.bar.isWishlisted || false
  },
  { immediate: true }
)

const toggleFavorite = () => {
  localIsWishlisted.value = !localIsWishlisted.value
}

// 關閉 modal（若收藏狀態改變 → emit toggle）
const handleClose = () => {
  if (localIsWishlisted.value !== props.bar.isWishlisted) {
    emit('toggle-wishlist', props.bar)
  }
  emit('close')
}

// 上傳圖片
const fileInput = ref(null)
const triggerFileUpload = () => fileInput.value?.click()
const handleFileUpload = (e) => {
  const file = e.target.files?.[0]
  if (file) {
    alert(`選取檔案：${file.name} (${file.size} bytes)`)
    fileInput.value.value = ''
  }
}

// 導到活動頁面
const goToBarActivities = () => {
  handleClose()
  router.push('/events')
}

// 模擬評論
const mockReviews = [
  {
    name: '新用戶',
    date: '2024年05月20日',
    avatar: 'https://via.placeholder.com/40',
    text: '這家酒吧氛圍超好，調酒師也很專業，推薦他們的招牌特調！會再來！',
    up: 10,
    down: 0
  },
  {
    name: '常造訪用戶',
    date: '2024年05月15日',
    avatar: 'https://via.placeholder.com/40',
    text: '信義區的夜景真的無敵，這裡的視野很棒。調酒有創意，但價格偏高一些。',
    up: 7,
    down: 1
  }
]
</script>