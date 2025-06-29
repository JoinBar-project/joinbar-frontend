<template>
  <transition name="modal-fade">
    <div
      class="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-5"
      @click.self="handleClose">
      <div
        class="modal-content bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden relative flex flex-col shadow-2xl">
        <!-- 關閉按鈕 -->
        <button
          class="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm border-0 rounded-full w-10 h-10 flex items-center justify-center cursor-pointer transition-all hover:bg-white hover:scale-110"
          @click="handleClose">
          <i class="fa-solid fa-xmark text-gray-600 text-xl"></i>
        </button>

        <div class="flex flex-1 overflow-hidden">
          <!-- 圖片區域 -->
          <div class="flex-1 relative min-h-96">
            <img
              :src="currentImage"
              alt="Bar Image"
              class="w-full h-full object-cover"
              @error="handleImageError"/>
            <div
              v-if="bar.images?.length > 1"
              class="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-4">
              <button
                class="bg-white/80 border-0 rounded-full w-10 h-10 cursor-pointer text-lg font-bold text-gray-800 transition-all hover:bg-white hover:scale-110"
                @click="prevImage">
                &lt;
              </button>
              <button
                class="bg-white/80 border-0 rounded-full w-10 h-10 cursor-pointer text-lg font-bold text-gray-800 transition-all hover:bg-white hover:scale-110"
                @click="nextImage">
                &gt;
              </button>
            </div>
            <div
              v-if="bar.images?.length > 1"
              class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2"
            >
              <span
                v-for="(img, index) in bar.images"
                :key="index"
                :class="[
                  'w-2 h-2 rounded-full cursor-pointer transition-all',
                  index === currentImageIndex ? 'bg-white scale-125' : 'bg-white/50',
                ]"
                @click="setCurrentImage(index)"
              ></span>
            </div>
          </div>

          <!-- 詳細資訊區域 -->
          <div class="flex-1 overflow-y-auto bg-slate-50">
            <div class="p-6 h-full">
              <h2 class="text-2xl font-bold text-gray-900 mb-3">{{ bar.name }}</h2>

              <div class="flex justify-between items-center mb-5 pb-3 border-b border-gray-200">
                <span class="rating">⭐️ {{ bar.rating || 'N/A' }} ({{ bar.reviews || 0 }} 評論)</span>
                <span
                  class="text-[var(--color-primary-orange)] font-bold text-lg"
                  >NT$ {{ bar.priceRange || '???' }}</span>
              </div>
              <div class="contact-info">
                <p
                  v-if="bar.address"
                  class="flex items-center mb-2 text-gray-700 text-sm"
                >
                  <span class="icon">📍</span>
                  {{ bar.address }}
                </p>
                <p v-if="bar.phone" class="flex items-center mb-2 text-gray-700 text-sm">
                  <span class="icon">📞</span>
                  {{ bar.phone }}
                </p>
                <p v-if="bar.website" class="flex items-center mb-2 text-gray-700 text-sm">
                  <span class="icon">🌐</span>
                  <a
                    :href="bar.website"
                    target="_blank"
                    class="text-blue-500 hover:underline"
                    >{{ bar.website }}</a
                  >
                </p>
              </div>

              <div class="mb-5">
                <h3 class="text-base font-semibold text-gray-900 mb-2 mt-5">營業時間</h3>
                <p class="text-gray-600 text-sm">
                  {{ bar.openingHours?.weekday_text?.[0] || bar.openingHoursText || '未提供營業時間' }}
                </p>
              </div>

              <div v-if="bar.tags?.length" class="mb-5">
                <h3 class="text-base font-semibold text-gray-900 mb-2 mt-5">
                  特色標籤
                </h3>
                <div class="flex flex-wrap gap-2 mb-1">
                  <span
                    v-for="(tag, index) in bar.tags"
                    :key="index"
                    class="bg-gray-200 text-gray-800 px-3 py-1 rounded-2xl text-xs font-medium"
                    >{{ getTagLabel(tag) }}</span
                  >
                </div>
              </div>

              <div class="mb-5">
                <h3 class="text-base font-semibold text-gray-900 mb-2 mt-5">酒吧介紹</h3>
                <p class="text-gray-600 text-sm leading-relaxed">
                  {{ bar.description || '暫無詳細介紹。' }}
                </p>
              </div>

              <div>
                <h3 class="text-base font-semibold text-gray-900 mb-2 mt-5">熱門評論</h3>
                <div class="max-h-48 overflow-y-auto">
                  <template v-if="bar.googleReviews && bar.googleReviews.length">
                    <div
                      v-for="(review, index) in bar.googleReviews.slice(0, 3)"
                      :key="index"
                      class="bg-white rounded-xl p-4 mb-3 border border-gray-200"
                    >
                      <div class="flex items-center mb-2">
                        <img
                          :src="review.profile_photo_url || 'https://via.placeholder.com/40'"
                          alt="User Avatar"
                          class="w-8 h-8 rounded-full mr-2"
                        />
                        <div class="flex flex-col">
                          <span class="font-semibold text-gray-900 text-sm">
                            {{ review.author_name || '匿名用戶' }}
                          </span>
                          <span class="text-gray-400 text-xs">{{ formatReviewDate(review.time) }}</span>
                        </div>
                      </div>
                      <p class="text-gray-700 text-sm leading-relaxed mb-2">
                        {{ review.text }}
                      </p>
                      <div class="flex gap-4">
                        <span class="text-gray-600 text-xs">
                          👍 有用 ({{ review.rating || 0 }})
                        </span>
                        <span class="text-gray-600 text-xs">
                          👎 不喜歡 ({{ review.rating || 0 }})
                        </span>
                      </div>
                    </div>
                  </template>
                  <div v-else class="text-gray-500 text-sm">暫無 Google 評論</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部操作區域 -->
        <div
          class="flex justify-between items-center p-4 bg-white border-t border-gray-200">
          <div class="flex gap-3">
            <!-- 新增照片 -->
            <div class="tooltip" data-tip="新增照片">
              <button
                class="w-11 h-11 rounded-xl border border-gray-200 bg-white flex items-center justify-center cursor-pointer transition-all hover:bg-gray-50 hover:border-gray-300 hover:-translate-y-0.5"
              @click="triggerFileUpload">
                <i class="fa-regular fa-image text-lg text-gray-600"></i>
              </button>
            </div>
            <input
              type="file"
              ref="fileInput"
              class="hidden"
              accept="image/*"
              @change="handleFileUpload"/>

            <!-- 分享 -->
            <div class="tooltip" data-tip="分享">
              <button
                class="w-11 h-11 rounded-xl border border-gray-200 bg-white flex items-center justify-center cursor-pointer transition-all hover:bg-gray-50 hover:border-gray-300 hover:-translate-y-0.5">
                <i class="fa-solid fa-share-nodes text-lg text-gray-600"></i>
              </button>
            </div>

            <!-- 導航 -->
            <div class="tooltip" data-tip="導航">
              <button
                class="w-11 h-11 rounded-xl border border-gray-200 bg-white flex items-center justify-center cursor-pointer transition-all hover:bg-gray-50 hover:border-gray-300 hover:-translate-y-0.5"
                @click="navigateToBar(bar.latitude, bar.longitude)">
                <i class="fa-regular fa-paper-plane text-lg text-gray-600"></i>
              </button>
            </div>

            <!-- 收藏 -->
            <div
              class="tooltip"
              :data-tip="localIsWishlisted ? '取消收藏' : '加入收藏'">
              <button
                :class="[
                  'w-11 h-11 rounded-xl border flex items-center justify-center cursor-pointer transition-all hover:-translate-y-0.5',
                  localIsWishlisted
                    ? 'bg-red-50 border-red-200'
                    : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300',
                ]"
                @click.stop="toggleFavorite"
                :disabled="favoriteLoading">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  :fill="localIsWishlisted ? '#ef4444' : 'none'"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  :class="localIsWishlisted ? 'text-red-500' : 'text-gray-600'">
                  <path
                    d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
                      2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09
                      C13.09 3.81 14.76 3 16.5 3
                      19.58 3 22 5.42 22 8.5
                      c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- 發起活動 -->
          <div class="lg:tooltip" data-tip="發起活動">
            <button
              class="bg-gradient-to-r from-[var(--color-secondary-green)] via-[#d8dbaf] to-[var(--color-primary-orange)] text-[var(--color-black)] border-0 rounded-xl px-6 py-3 font-semibold cursor-pointer flex items-center gap-2 transition-all hover:scale-105 hover:brightness-110 hover:shadow-lg"
              @click="goToBarActivities">
              <span>發起活動</span>
              <i class="fa-solid fa-plus text-sm"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFavoritesStore } from '@/stores/favorites'
import { storeToRefs } from 'pinia'
import placeTypeMap from '@/composables/placeTypeMap'

const props = defineProps({ bar: Object })
const emit = defineEmits(['close', 'toggle-wishlist'])
const router = useRouter()

// 使用收藏 store
const favoritesStore = useFavoritesStore()
const { loading: favoriteLoading } = storeToRefs(favoritesStore)

// 圖片切換邏輯
const currentImageIndex = ref(0)
const defaultImage = 'https://placehold.co/800x600/decdd5/860914?text=bar+Image'
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

// 導航到酒吧位置
const navigateToBar = (lat, lng) => {
  if (!lat || !lng) {
    alert('此酒吧尚未提供定位資訊');
    return;
  }

  const url = `https://www.google.com/maps/dir/?api=1&origin=Current+Location&destination=${lat},${lng}&travelmode=walking`;
  window.open(url, '_blank');
}

// 收藏愛心狀態（local，變動 emit 出去）
const localIsWishlisted = ref(false)

// 計算收藏狀態
const isWishlisted = computed(() => {
  const identifier = props.bar.place_id || props.bar.googlePlaceId || props.bar.id;
  return favoritesStore.isFavorited(identifier);
});

watch(
  () => props.bar,
  () => {
    currentImageIndex.value = 0
    localIsWishlisted.value = isWishlisted.value
  },
  { immediate: true }
)

// 更新收藏切換功能
const toggleFavorite = async () => {
  try {
    // 準備完整的酒吧資料
    const barData = {
      ...props.bar,
      // 確保有正確的識別碼
      place_id: props.bar.place_id || props.bar.googlePlaceId,
      googlePlaceId: props.bar.googlePlaceId || props.bar.place_id,
      id: props.bar.id || props.bar.barId,
      // 確保有完整的圖片資料
      images: props.bar.images || (props.bar.imageUrl ? [props.bar.imageUrl] : []),
      // 確保有評論資料
      googleReviews: props.bar.googleReviews || []
    };
    
    await favoritesStore.toggleFavorite(barData);
    
    // 更新本地狀態
    localIsWishlisted.value = !localIsWishlisted.value;
    
    // 通知父組件
    emit('toggle-wishlist', props.bar);
  } catch (error) {
    console.error("Failed to toggle favorite:", error);
    alert("操作失敗，請稍後再試");
  }
}

// 關閉 modal（若收藏狀態改變 → emit toggle）
const handleClose = () => {
  if (localIsWishlisted.value !== isWishlisted.value) {
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
  router.push('/event')
}

// 格式化評論日期
function formatReviewDate(unixTime) {
  if (!unixTime) return "";
  const date = new Date(unixTime * 1000);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

// 獲取標籤標籤
const getTagLabel = (tag) => {
  return placeTypeMap?.[tag] || tag;
};

// 載入時確保收藏狀態是最新的
onMounted(() => {
  // 如果 store 還沒載入收藏列表，先載入
  if (favoritesStore.favoriteBars.length === 0) {
    favoritesStore.fetchFavorites();
  }
});
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-content {
  transition: transform 0.3s ease;
}

.modal-fade-enter-from .modal-content,
.modal-fade-leave-to .modal-content {
  transform: scale(0.9);
}
</style>