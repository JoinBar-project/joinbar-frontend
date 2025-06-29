<template>
  <div class="favorites-container p-4">
    <h1 class="text-2xl font-bold mb-6 text-gray-800">我的酒吧收藏</h1>
    
    <!-- 載入中狀態 -->
    <div v-if="loading" class="text-center py-16">
      <div class="loader"></div>
      <p class="mt-4 text-gray-500">載入收藏列表中...</p>
    </div>

    <!-- 錯誤狀態 -->
    <div v-else-if="error" class="text-center py-16">
      <p class="text-red-500 mb-4">{{ error }}</p>
      <button 
        @click="retry" 
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        重試
      </button>
    </div>

    <!-- 空狀態 -->
    <div v-else-if="favoriteBars.length === 0" class="text-center text-gray-500 py-16 text-lg">
      <i class="far fa-heart text-6xl mb-4 text-gray-300"></i>
      <p class="mb-4">目前你的收藏清單還空空的喔！</p>
      <router-link 
        to="/map" 
        class="inline-block px-6 py-3 bg-[#860914] text-white rounded-lg hover:bg-[#6a070f] transition-colors"
      >
        探索酒吧地圖
      </router-link>
    </div>

    <!-- 收藏列表 -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="bar in favoriteBars"
        :key="bar.barId || bar.id"
        @click="selectBar(bar)"
        class="card bg-white shadow-md hover:shadow-xl transition-all hover:-translate-y-1 rounded-xl overflow-hidden cursor-pointer"
      >
        <!-- 圖片區塊 -->
        <figure class="relative h-44 overflow-hidden">
          <img
            :src="bar.imageUrl || defaultPlaceholderImage"
            :alt="bar.name"
            class="w-full h-full object-cover transition-transform hover:scale-105"
            loading="lazy"
            @error="handleImageError"
          />
        
          <button
            class="w-8 h-8 rounded-full absolute top-3 right-3 bg-rose-600 hover:bg-rose-700 transition-colors"
            @click.stop="removeFavorite(bar)"
            :disabled="loading"
            aria-label="取消收藏"
          >
            <i class="fas fa-heart text-white text-sm"></i>
          </button>
        </figure>

        <!-- 內容區塊 -->
        <div class="card-body p-4 space-y-2">
          <h3 class="text-lg font-semibold text-gray-800 truncate">
            {{ bar.name }}
          </h3>

          <div class="flex items-center gap-2 text-sm text-gray-600">
            <span class="flex items-center">
              ⭐️ {{ bar.rating || "N/A" }}
            </span>
            <span class="text-xs text-gray-400">
              ({{ bar.reviews || "0" }} 評論)
            </span>
          </div>

          <p class="text-sm text-gray-500 line-clamp-2">
            📍 {{ bar.address || "地址未提供" }}
          </p>

          <div v-if="bar.tags && bar.tags.length" class="flex flex-wrap gap-1">
            <span
              v-for="(tag, index) in bar.tags.slice(0, 3)"
              :key="index"
              class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
            >
              {{ getTagLabel(tag) }}
            </span>
            <span v-if="bar.tags.length > 3" class="text-xs text-gray-400">
              +{{ bar.tags.length - 3 }}
            </span>
          </div>

          <p class="text-sm text-gray-500 mt-2">
            {{ getOpeningStatus(bar) }}
          </p>
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

// Store
const favoritesStore = useFavoritesStore();
const { favoriteBars, loading, error } = storeToRefs(favoritesStore);

// 本地狀態
const selectedBar = ref(null);
const showModal = ref(false);
const defaultPlaceholderImage = 'https://placehold.co/400x300/decdd5/860914?text=No+Image';

// 生命週期 - 載入收藏列表
onMounted(async () => {
  await favoritesStore.fetchFavorites();
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
</script>

<style scoped>
.favorites-container {
  min-height: calc(100vh - 80px);
  background-color: #f5f5f5;
}

.loader {
  width: 48px;
  height: 48px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #860914;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>