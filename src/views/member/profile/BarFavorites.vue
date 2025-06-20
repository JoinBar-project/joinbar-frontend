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
        <!-- 圖片區塊 -->
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
            @click.stop="toggleWishlist(bar)"
            :class="bar.isWishlisted ? 'bg-rose-700' : 'bg-gray-300'"
            :aria-label="bar.isWishlisted ? '取消收藏' : '加入收藏'">
            <i class="fas fa-heart text-white text-sm"></i>
          </button>
        </figure>

        <!-- 內容區塊 -->
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
              {{ tag }}
            </span>
          </div>

          <p class="text-sm text-gray-500 mt-auto">
            {{ getOpeningHourText(bar) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Modal 彈窗 -->
    <transition name="fade">
      <div
        v-if="showModal"
        class="fixed inset-0 z-50 bg-black/50 flex justify-center items-center"
        @click.self="closeModal">
        <div class="relative max-w-3xl w-full bg-[var(--color-black)] rounded-xl overflow-hidden shadow-2xl">
          <FavoriteDetailCard v-if="selectedBar" :bar="selectedBar" @close="closeModal" @toggle-wishlist="toggleWishlist" />
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useWishlistStore } from '@/stores/wishlist';
import FavoriteDetailCard from '@/components/member/FavoriteDetailCard.vue';

const selectedBar = ref(null)
const showModal = ref(false)

function selectBar(bar) {
  selectedBar.value = bar
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  selectedBar.value = null
}

const mockFavorites = ref(
  Array.from({ length: 10 }, (_, i) => ({
    id: `bar${i + 1}`,
    place_id: `bar${i + 1}`,
    name: `酒吧 ${i + 1}`,
    rating: (Math.random() * 2 + 3).toFixed(1), // 3.0~5.0
    reviews: Math.floor(Math.random() * 200),
    priceRange: [300, 400, 500][i % 3],
    tags: ['微醺', '約會', '熱鬧'].slice(0, (i % 3) + 1),
    imageUrl: `https://www.tinbuilding.com/wp-content/uploads/2024/10/Tin-Building_Cocktail-Bar_007_mm6jnz-scaled.jpg`,
    openNow: [i % 2] === 0,
    isWishlisted: true
  }))
)

const bars = computed(() => mockFavorites.value)

function emitToggleWishlist(bar) {
  const index = mockFavorites.value.findIndex(b => b.id === bar.id)
  if (index !== -1) {
    mockFavorites.value.splice(index, 1)
  }
}

const defaultPlaceholderImage = '/bar-placeholder.jpg'

function handleImageError(event) {
  event.target.src = defaultPlaceholderImage
}

function toggleWishlist(bar) {
  const found = mockFavorites.value.find(b => b.id === bar.id)
  if (found) {
    found.isWishlisted = !found.isWishlisted
  }
}

function getOpeningHourText(bar) {
  return bar.openNow ? '營業中' : '已打烊'
}

// // 取得 Pinia 的 wishlist store 實例
// const wishlistStore = useWishlistStore()

// // 用 computed 取得收藏清單
// const bars = computed(() => wishlistStore.wishlist)

// // 點擊收藏按鈕切換收藏狀態
// function toggleWishlist(bar) {
//   wishlistStore.toggle(bar)
// }

// // 範例：點擊卡片顯示詳細（可自行實作）
// function selectBar(bar) {
//   console.log('顯示詳細酒吧資訊:', bar)
// }
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>