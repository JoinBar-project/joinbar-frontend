<template>
  <div class="p-4">
    <div v-if="bars.length === 0" class="text-center text-gray-500 py-16 text-lg">
      目前你的收藏清單還空空的喔！
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="bar in bars"
        :key="bar.place_id || bar.id"
        @click="selectBar(bar)"
        class="card bg-white shadow-md hover:shadow-xl transition-transform hover:-translate-y-1 rounded-xl overflow-hidden cursor-pointer">
        <figure class="relative h-44 overflow-hidden">
          <img
            :src="bar.imageUrl || defaultPlaceholderImage"
            :alt="bar.name"
            class="w-full h-full object-cover"
            loading="lazy"
            @error="handleImageError"
          />
        
          <button
            class="w-8 h-8 rounded-full absolute top-3 right-3 hover:bg-rose-400"
            @click.stop="toggleFavorite(bar)" :class="favoritesStore.isBarFavorited(bar.place_id) ? 'bg-rose-700' : 'bg-gray-300'" :aria-label="favoritesStore.isBarFavorited(bar.place_id) ? '取消收藏' : '加入收藏'">
            <i class="fas fa-heart text-white text-sm"></i>
          </button>
        </figure>

        <div class="card-body space-y-2">
          <h3 class="text-lg font-semibold text-gray-800 truncate">
            {{ bar.name }}
          </h3>

          <div class="flex justify-between items-center text-sm text-gray-600">
            <div>
              ⭐️ {{ bar.rating || "N/A" }}
              <span class="ml-1 text-xs text-gray-400">
                ({{ bar.reviews || "0" }} 評論)
              </span>
            </div>
            <span class="text-[var(--color-primary-orange)] font-semibold">
              NT$ {{ bar.priceRange || "???" }}
            </span>
          </div>

          <div
            v-if="bar.tags && bar.tags.length"
            class="flex flex-wrap gap-2">
            <span
              v-for="tag in bar.tags"
              :key="tag"
              class="badge badge-ghost text-xs">
              {{ getTagLabel(tag) }} </span>
          </div>

          <p class="text-sm text-gray-500 mt-auto">
            {{ getOpeningHourText(bar) }}
          </p>
        </div>
      </div>
    </div>

    <transition name="fade">
      <div
        v-if="showModal"
        class="fixed inset-0 z-50 bg-black/50 flex justify-center items-center"
        @click.self="closeModal">
        <div class="relative max-w-3xl w-full bg-[var(--color-black)] rounded-xl overflow-hidden shadow-2xl">
          <FavoriteDetailCard v-if="selectedBar" :bar="selectedBar" @close="closeModal" @toggle-wishlist="toggleFavorite" />
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useFavoritesStore } from '@/stores/favorites'; // 引入 Pinia Store
import FavoriteDetailCard from '@/components/member/FavoriteDetailCard.vue';
import placeTypeMap from '@/composables/placeTypeMap'; // 引入 placeTypeMap

// 實例化 Pinia Store
const favoritesStore = useFavoritesStore();

const selectedBar = ref(null);
const showModal = ref(false);

// 直接從 Pinia Store 獲取收藏的酒吧列表
const bars = computed(() => favoritesStore.getFavoriteBars);

// 預設圖片路徑
const defaultPlaceholderImage = '/bar-placeholder.jpg'; // 請確保此圖片存在於 public 資料夾或正確路徑

// 圖片載入失敗處理
function handleImageError(event) {
  event.target.src = defaultPlaceholderImage;
}

// 點擊卡片顯示詳細資訊
function selectBar(bar) {
  selectedBar.value = bar;
  showModal.value = true;
}

// 關閉 Modal
function closeModal() {
  showModal.value = false;
  selectedBar.value = null;
}

// 切換收藏狀態（從卡片或詳細頁面呼叫）
function toggleFavorite(bar) {
  favoritesStore.toggleFavorite(bar);
  // 如果是從詳細頁面點擊導致收藏狀態改變，且該酒吧被移除，則關閉 Modal
  if (!favoritesStore.isBarFavorited(bar.place_id)) {
    closeModal();
  }
}

// 取得營業時間文字
function getOpeningHourText(bar) {
  // 這裡假設 bar.is_open 已經被正確賦值 (來自 Google Places API 的 isOpen())
  if (bar.is_open === true) {
    return '營業中';
  }
  if (bar.is_open === false) {
    return '已打烊';
  }
  // 如果沒有 is_open 屬性，嘗試從 opening_hours.weekday_text 獲取，否則顯示未提供
  if (bar.opening_hours?.weekday_text?.length > 0) {
    return bar.opening_hours.weekday_text[0]; // 顯示第一天的營業時間作為概覽
  }
  return '未提供營業時間';
}

// 轉換標籤名稱
const getTagLabel = (tag) => {
  return placeTypeMap[tag] || tag;
};

// 元件掛載時，從 Local Storage 載入收藏數據
onMounted(() => {
  favoritesStore.loadFavoritesFromLocalStorage();
});
</script>

<style scoped>
/* 將 Tailwind CSS class 轉為 scoped style 以確保樣式獨立性，
   如果您全局使用了 Tailwind CSS，則可移除這些重複的樣式 */

/* Card Styles */
.card {
  background-color: #ffffff;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 0.75rem; /* rounded-xl */
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.card:hover {
  transform: translateY(-0.25rem); /* hover:-translate-y-1 */
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05); /* hover:shadow-xl */
}

/* Image Section */
.card figure {
  position: relative;
  height: 11rem; /* h-44 (11 * 16px = 176px) */
  overflow: hidden;
}

.card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card button {
  width: 2rem; /* w-8 */
  height: 2rem; /* h-8 */
  border-radius: 9999px; /* rounded-full */
  position: absolute;
  top: 0.75rem; /* top-3 */
  right: 0.75rem; /* right-3 */
  display: flex;
  justify-content: center;
  align-items: center;
  transition: background-color 0.2s ease;
}

.card button.bg-rose-700 {
  background-color: #be123c; /* Tailwind rose-700 */
}

.card button.bg-gray-300 {
  background-color: #d1d5db; /* Tailwind gray-300 */
}

.card button:hover {
  background-color: #fb7185; /* Tailwind rose-400 */
}

.card button i {
  color: #ffffff;
  font-size: 0.875rem; /* text-sm */
}

/* Card Body */
.card-body {
  padding: 1.5rem; /* p-6 */
  display: flex;
  flex-direction: column;
  gap: 0.5rem; /* space-y-2 */
}

.card-body h3 {
  font-size: 1.125rem; /* text-lg */
  font-weight: 600; /* font-semibold */
  color: #1f2937; /* text-gray-800 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-body > div {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem; /* text-sm */
  color: #4b5563; /* text-gray-600 */
}

.card-body span.ml-1 {
  margin-left: 0.25rem; /* ml-1 */
  font-size: 0.75rem; /* text-xs */
  color: #9ca3af; /* text-gray-400 */
}

.card-body span.text-\[var\(--color-primary-orange\)\] {
  color: var(--color-primary-orange);
  font-weight: 600; /* font-semibold */
}

.card-body .flex-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem; /* gap-2 */
}

.card-body .badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.5rem; /* px-2 py-1 */
  border-radius: 9999px; /* rounded-full */
  font-size: 0.75rem; /* text-xs */
  font-weight: 500;
}

.card-body .badge-ghost {
  background-color: #e5e7eb; /* Tailwind bg-gray-200, similar to badge-ghost default */
  color: #4b5563; /* text-gray-600 */
}

.card-body p {
  font-size: 0.875rem; /* text-sm */
  color: #6b7280; /* text-gray-500 */
  margin-top: auto;
}

/* Modal transition */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Other general styles for the page */
.bar-favorites-container {
  padding: 1rem; /* p-4 */
}

.text-center {
  text-align: center;
}

.text-gray-500 {
  color: #6b7280;
}

.py-16 {
  padding-top: 4rem; /* 16 * 16px = 256px */
  padding-bottom: 4rem;
}

.text-lg {
  font-size: 1.125rem;
  line-height: 1.75rem;
}

.grid {
  display: grid;
}

.grid-cols-1 {
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

@media (min-width: 640px) { /* sm breakpoint */
  .sm\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) { /* lg breakpoint */
  .lg\:grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.gap-6 {
  gap: 1.5rem; /* 6 * 16px = 96px */
}

.fixed {
  position: fixed;
}

.inset-0 {
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
}

.z-50 {
  z-index: 50;
}

.bg-black\/50 {
  background-color: rgba(0, 0, 0, 0.5);
}

.flex {
  display: flex;
}

.justify-center {
  justify-content: center;
}

.items-center {
  align-items: center;
}

.relative {
  position: relative;
}

.max-w-3xl {
  max-width: 48rem; /* 48 * 16px = 768px */
}

.w-full {
  width: 100%;
}

.bg-\[var\(--color-black\)\] {
  background-color: var(--color-black); /* Assuming this is defined elsewhere, if not, adjust */
}

.shadow-2xl {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
</style>