<template>
  <div class="bar-list-wrapper">
    <div v-if="favoriteBars.length === 0" class="no-results">
      目前沒有符合條件的酒吧。
    </div>
    <div v-else class="bar-cards-list">
      <div
        v-for="bar in favoriteBars"
        :key="bar.googlePlaceId || bar.id"
        class="bar-card"
        @click="selectBar(bar)"
      >
        <div class="bar-card-image">
          <img
            :src="bar.images && bar.images.length > 0 ? bar.images[0] : bar.imageUrl || defaultPlaceholderImage"
            :alt="bar.name || 'Bar'"
            class="bar-image"
            loading="lazy"
            @error="handleImageError"
          />
          <button
            class="wishlist-button"
            @click.stop="removeFavorite(bar)"
            :aria-label="'取消收藏'"
            :disabled="loading"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="wishlist-icon"
              :fill="'red'"
              viewBox="0 0 24 24"
              stroke="none"
            >
              <path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              />
            </svg>
          </button>
        </div>
        <div class="bar-card-content">
          <h3 class="bar-name">{{ bar.name }}</h3>
          <div class="bar-rating-price">
            <span class="bar-rating">⭐️ {{ bar.rating || 'N/A' }}</span>
            <span class="bar-reviews"> ({{ bar.reviews || 0 }} 評論)</span>
          </div>
          <div v-if="bar.tags && bar.tags.length" class="bar-tags">
            <span v-for="tag in bar.tags || []" :key="tag" class="bar-tag">{{ getTagLabel(tag) }}</span>
          </div>
          <div class="bar-hours">
            {{ bar.openingHoursText ? bar.openingHoursText.split('\n')[0] : '營業時間未提供' }}
          </div>
          <p class="bar-address">📍 {{ bar.address || '地址未提供' }}</p>
        </div>
      </div>
    </div>
    <!-- Modal 彈窗 -->
    <transition name="fade">
      <div
        v-if="showModal && selectedBar"
        class="fixed inset-0 z-50 bg-black/50 flex justify-center items-center p-4"
        @click.self="closeModal"
      >
        <div class="relative max-w-4xl w-full">
          <FavoriteDetailCard 
            :bar="formatBarForModal(selectedBar)" 
            @close="closeModal" 
            @toggle-wishlist="handleToggleWishlist" 
          />
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useFavoritesStore } from '@/stores/favorites';
import { storeToRefs } from 'pinia';
import FavoriteDetailCard from '@/components/member/FavoriteDetailCard.vue';
import placeTypeMap from '@/composables/placeTypeMap';
import { useGooglePlaceDetails } from '@/composables/useGooglePlaceDetails';

// Store
const favoritesStore = useFavoritesStore();
const { favoriteBars, loading, error } = storeToRefs(favoritesStore);

// 本地狀態
const selectedBar = ref(null);
const showModal = ref(false);
const defaultPlaceholderImage = 'https://placehold.co/400x300/decdd5/860914?text=No+Image';

// Google Place Details
const { getPlaceDetails } = useGooglePlaceDetails();

// 生命週期 - 載入收藏列表
onMounted(async () => {
  await favoritesStore.fetchFavorites();
  for (const bar of favoriteBars.value) {
    await patchGoogleDetails(bar);
  }
});

// 重試載入
const retry = async () => {
  favoritesStore.clearError();
  await favoritesStore.fetchFavorites();
};

// 選擇酒吧顯示詳情
function selectBar(bar) {
  selectedBar.value = bar;
  showModal.value = true;
}

// 關閉詳情
function closeModal() {
  showModal.value = false;
  setTimeout(() => {
    selectedBar.value = null;
  }, 300);
}

// 格式化資料給 FavoriteDetailCard
function formatBarForModal(bar) {
  return {
    ...bar,
    // 確保有正確的格式給 FavoriteDetailCard
    isWishlisted: true, // 在收藏頁面的都是已收藏
    images: bar.images || (bar.imageUrl ? [bar.imageUrl] : []),
    openingHours: bar.opening_hours || {
      weekday_text: bar.openingHoursText ? bar.openingHoursText.split('\n') : []
    },
    // 確保有完整的聯絡資訊
    phone: bar.phone,
    website: bar.website,
    // 標籤處理
    tags: Array.isArray(bar.tags) ? bar.tags : [],
    // 其他資訊
    description: bar.description || '暫無詳細介紹',
    priceRange: bar.priceRange
  };
}

// 移除收藏
async function removeFavorite(bar) {
  if (!confirm(`確定要取消收藏「${bar.name}」嗎？`)) return;
  
  try {
    // 準備正確的資料格式
    const barData = {
      ...bar,
      id: bar.barId, // 確保有正確的 id
      googlePlaceId: bar.googlePlaceId
    };
    
    await favoritesStore.toggleFavorite(barData);
    // Store 會自動更新 favoriteBars，不需要額外處理
  } catch (error) {
    alert('操作失敗，請稍後再試');
  }
}

// 處理詳情頁的收藏切換
async function handleToggleWishlist(bar) {
  // 因為在收藏頁面，toggle 就是移除
  await removeFavorite(bar);
  closeModal();
}

// 處理圖片錯誤
function handleImageError(event) {
  event.target.src = defaultPlaceholderImage;
  event.target.onerror = null;
}

// 獲取標籤文字
function getTagLabel(tag) {
  return placeTypeMap?.[tag] || tag;
}

// 獲取營業狀態
function getOpeningStatus(bar) {
  if (bar.is_open === true) return '🟢 營業中';
  if (bar.is_open === false) return '🔴 已打烊';
  if (bar.openingHoursText) return '🕐 查看營業時間';
  return '🕐 營業時間未提供';
}

async function patchGoogleDetails(bar) {
  if (!bar.googlePlaceId) return;
  try {
    const detail = await getPlaceDetails(bar.googlePlaceId);
    if (detail) {
      bar.imageUrl = detail.photos?.[0]?.getUrl({ maxWidth: 400 }) || bar.imageUrl;
      bar.images = detail.photos?.map(p => p.getUrl({ maxWidth: 800 })) || bar.images;
      bar.rating = detail.rating;
      bar.reviews = detail.user_ratings_total;
      bar.openingHoursText = detail.opening_hours?.weekday_text?.join('\n') || '';
      bar.website = detail.website;
      bar.googleReviews = detail.reviews || [];
    }
  } catch (e) {
    if (!bar.imageUrl) bar.imageUrl = 'https://placehold.co/800x600/decdd5/860914?text=No+Image';
    if (!bar.images || bar.images.length === 0) bar.images = [bar.imageUrl];
  }
}
</script>

<style scoped>
.bar-list-wrapper {
  padding: 16px;
}

.no-results {
  text-align: center;
  color: #6b7280;
  padding: 32px;
  font-size: 18px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bar-cards-list {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}

.bar-card {
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  cursor: pointer;
  transition:
    transform 0.2s ease-in-out,
    box-shadow 0.2s ease-in-out;
  border: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  position: relative;
  width: 350px;
  min-width: 320px;
  max-width: 400px;
}

.bar-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 0 0 2px rgba(184, 162, 142, 0.2);
}

.bar-card-image {
  width: 100%;
  height: 180px;
  overflow: hidden;
  position: relative;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}

.bar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.wishlist-button {
  position: absolute;
  top: 12px;
  right: 12px;
  background-color: rgba(0, 0, 0, 0.4);
  border: none;
  border-radius: 50%;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  z-index: 10;
}

.wishlist-button:hover {
  background-color: rgba(0, 0, 0, 0.6);
}

.wishlist-icon {
  width: 24px;
  height: 24px;
  transition: fill 0.2s ease;
}

.bar-card-content {
  padding: 16px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.bar-name {
  font-size: 20px;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bar-rating-price {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 8px;
  gap: 8px;
}

.bar-rating {
  font-size: 14px;
  color: #4a5568;
  display: flex;
  align-items: center;
}

.bar-reviews {
  margin-left: 4px;
  font-size: 14px;
  color: #4a5568;
}

.bar-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.bar-tag {
  background-color: #f0f0f0;
  color: #4a5568;
  padding: 5px 11px;
  border-radius: 16px;
  font-size: 13px;
  white-space: nowrap;
}

.bar-hours {
  font-size: 14px;
  color: #4a5568;
  margin-top: auto;
}

.bar-address {
  font-size: 14px;
  color: #4a5568;
  margin-top: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>