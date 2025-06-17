<template>
  <div class="p-4">
    <div v-if="bars.length === 0" class="text-center text-gray-500 py-16 text-lg">
      目前沒有符合條件的酒吧。
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="bar in bars"
        :key="bar.place_id || bar.id"
        @click="selectBar(bar)"
        class="card bg-white shadow-md hover:shadow-xl transition-transform hover:-translate-y-1 rounded-xl overflow-hidden cursor-pointer"
      >
        <!-- 圖片區塊 -->
        <figure class="relative h-44 overflow-hidden">
          <img
            :src="bar.imageUrl || defaultPlaceholderImage"
            :alt="bar.name"
            class="w-full h-full object-cover"
            loading="lazy"
            @error="handleImageError"
          />
          <!-- 收藏按鈕 -->
          <button
            class="btn btn-circle btn-sm absolute top-3 right-3 bg-black/40 hover:bg-black/60"
            @click.stop="emitToggleWishlist(bar)"
            :aria-label="bar.isWishlisted ? '取消收藏' : '加入收藏'">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-5 h-5"
              :fill="bar.isWishlisted ? 'red' : 'white'"
              viewBox="0 0 24 24"
              stroke="none"
            >
              <path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 
                    2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 
                    4.5 2.09C13.09 3.81 14.76 3 16.5 3 
                    19.58 3 22 5.42 22 8.5c0 3.78-3.4 
                    6.86-8.55 11.54L12 21.35z"
              />
            </svg>
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
            <span class="text-orange-600 font-semibold">
              NT$ {{ bar.priceRange || "???" }}
            </span>
          </div>

          <div
            v-if="bar.tags && bar.tags.length"
            class="flex flex-wrap gap-2"
          >
            <span
              v-for="tag in bar.tags"
              :key="tag"
              class="badge badge-ghost text-xs"
            >
              {{ tag }}
            </span>
          </div>

          <p class="text-sm text-gray-500 mt-auto">
            {{ getOpeningHourText(bar) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const mockFavorites = ref(
  Array.from({ length: 10 }, (_, i) => ({
    id: `bar${i + 1}`,
    place_id: `bar${i + 1}`,
    name: `酒吧 ${i + 1}`,
    rating: (Math.random() * 2 + 3).toFixed(1), // 3.0~5.0
    reviews: Math.floor(Math.random() * 200),
    priceRange: [300, 400, 500][i % 3],
    tags: ['微醺', '約會', '熱鬧'].slice(0, (i % 3) + 1),
    imageUrl: `https://source.unsplash.com/400x300/?bar,drink,nightlife&sig=${i}`,
    openNow: i % 2 === 0,
    isWishlisted: true
  }))
)

const bars = computed(() => mockFavorites.value)

function selectBar(bar) {
  console.log('點擊酒吧卡片:', bar)
}

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

function getOpeningHourText(bar) {
  return bar.openNow ? '營業中' : '已打烊'
}
</script>
