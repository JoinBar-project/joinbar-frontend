<template>
  <div class="bar-list-wrapper">
    <div v-if="bars.length === 0" class="no-results text-gray-600">
      目前沒有符合條件的酒吧。
    </div>
    <div v-else class="bar-cards-list">
      <div
        v-for="bar in bars"
        :key="bar.place_id || bar.id"
        class="bar-card"
        @click="selectBar(bar)"
      >
        <div class="bar-card-image">
          <img
            :src="
              bar.imageUrl ||
              'https://placehold.co/300x200/decdd5/860914?text=Bar+Image'
            "
            :alt="bar.name"
            class="object-cover w-full h-full rounded-t-lg"
          />
          <button
            class="wishlist-button"
            @click.stop="toggleFavorite(bar.place_id)"
            :aria-label="isFavorite(bar.place_id) ? '取消收藏' : '加入收藏'"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-6 h-6"
              :fill="isFavorite(bar.place_id) ? 'red' : 'white'"
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
          <h3 class="bar-name text-gray-900">{{ bar.name }}</h3>
          <div class="bar-rating-price">
            <span class="bar-rating text-gray-700"
              >⭐️ {{ bar.rating || "N/A" }}</span
            >
            <span class="bar-reviews text-gray-700 ml-1"> ({{ bar.user_ratings_total || "0" }} 評論)</span>
            <span class="bar-price text-orange-700">NT$ {{ bar.priceRange || "???" }}</span>
          </div>

          <div v-if="bar.tags && bar.tags.length" class="bar-tags">
            <span
              v-for="(tag, index) in bar.tags"
              :key="index"
              class="bar-tag text-gray-600"
              >{{ tag }}</span
            >
          </div>
          <div class="bar-hours text-gray-700">
            {{
              (bar.openingHours && bar.openingHours.weekday_text && bar.openingHours.weekday_text.length > 0)
                ? bar.openingHours.weekday_text[0]
                : (bar.openingHours ? "營業時間待提供" : "未提供營業時間")
            }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import type { PropType } from "vue";

// 定義 Bar 介面，明確屬性，特別是 place_id
interface Bar {
  id?: string; // 如果 place_id 不存在，可以用 id 作為 fallback
  place_id?: string; // 這是識別地點的唯一 ID，Google Places API 返回，使其可選
  name: string;
  imageUrl?: string;
  rating?: number;
  reviews?: number; // 添加 reviews 屬性以匹配您的數據
  user_ratings_total?: number; // Google Places API 的評論總數
  priceRange?: string; // 這需要您自己處理或定義
  tags?: string[]; // 從您的模擬數據中看到 tags 屬性
  types?: string[]; // Google Places API 的類型列表 (例如 'bar', 'restaurant') - 用於標籤
  openingHours?: google.maps.places.OpeningHours | { weekday_text?: string[] }; // Google Places API 的營業時間物件
  location?: { lat: number; lng: number }; // 添加 location 屬性以匹配您的數據
  description?: string; // 添加 description 屬性以匹配您的數據
  isWishlisted?: boolean; // 添加 isWishlisted 屬性以匹配您的數據
  distance?: number; // 添加 distance 屬性以匹配您的篩選邏輯
  // 其他您可能從 Google Places API 獲取的屬性...
}

const props = defineProps({
  bars: {
    type: Array as PropType<Bar[]>,
    default: () => [],
  },
});

const emit = defineEmits(["bar-selected"]);

const selectBar = (bar: Bar) => {
  emit("bar-selected", bar);
};

// --- 收藏功能相關的狀態和邏輯 ---
// 使用 Set 來存儲收藏的 place_id，方便快速查找和增刪
const favoritePlaceIds = ref<Set<string>>(new Set());

// 組件加載時從 localStorage 讀取收藏數據
onMounted(() => {
  const storedFavorites = localStorage.getItem("favorites");
  if (storedFavorites) {
    try {
      const parsedFavorites = JSON.parse(storedFavorites);
      // 確保從 localStorage 讀取的是陣列，並轉換為 Set
      if (Array.isArray(parsedFavorites)) {
        favoritePlaceIds.value = new Set(parsedFavorites);
      }
    } catch (e) {
      console.error("Failed to parse favorites from localStorage", e);
      // 如果解析失敗，清空無效數據，避免後續問題
      localStorage.removeItem("favorites");
    }
  }
});

// 監聽 favoritePlaceIds 變化，並同步到 localStorage
// deep: true 對於 Set 來說是必要的，因為 Set 內部元素的增刪不改變 Set 本身的引用
watch(
  favoritePlaceIds,
  (newVal) => {
    localStorage.setItem("favorites", JSON.stringify(Array.from(newVal)));
  },
  { deep: true }
);

// 檢查某個酒吧是否已收藏
const isFavorite = (placeId: string | undefined): boolean => {
  if (!placeId) return false; // 如果 placeId 不存在，則不可能是收藏的
  return favoritePlaceIds.value.has(placeId);
};

// 切換收藏狀態
const toggleFavorite = (placeId: string | undefined) => {
  if (!placeId) {
    console.warn("無法收藏/取消收藏，因為 place_id 不存在。");
    return;
  }
  if (favoritePlaceIds.value.has(placeId)) {
    // 已經收藏，取消收藏
    favoritePlaceIds.value.delete(placeId);
    console.log(`取消收藏: ${placeId}`);
  } else {
    // 未收藏，添加收藏
    favoritePlaceIds.value.add(placeId);
    console.log(`收藏: ${placeId}`);
  }
  // favoritePlaceIds 是 ref，Vue 會自動追蹤其變化並更新模板
};
</script>

<style scoped>
/* 您的現有樣式，已移除 color 相關的屬性，讓 Tailwind 類別來控制顏色 */

.bar-list-wrapper {
  padding: 16px;
  /* 移除這裡的 height 和 overflow 樣式，它們應該由父組件控制 */
  /* height: 100%; */
  /* overflow-y: auto; */
  /* overflow-x: hidden; */ /* 僅在父組件設置，讓它負責側邊欄的滾動 */
}

.no-results {
  text-align: center;
  /* color: #666; <--- 已移除，因為模板中已添加 text-gray-600 */
  padding: 32px;
  font-size: 18px;
}

.bar-cards-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  /* 移除這裡的任何 height 或 max-height，讓它自然撐開內容 */
  /* 確保沒有 overflow 屬性，除非你希望卡片列表內部有自己的滾動條 */
}

.bar-card {
  background-color: #ffffff;
  border-radius: 12px; x rgba(0, 0, 0, 0.1);
  overflow: hidden; /* 為了圓角，保留 */
  cursor: pointer;
  transition:
    transform 0.2s ease-in-out,
    box-shadow 0.2s ease-in-out;
  border: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  position: relative; /* 確保子元素的絕對定位是相對於卡片 */
}

.bar-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.bar-card-image {
  width: 100%;
  height: 180px;
  overflow: hidden;
  position: relative; /* 確保 wishlist-button 可以相對於圖片定位 */
}

.bar-card-image img {
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
  z-index: 10; /* 確保在圖片和其他內容上方 */
}

.wishlist-button:hover {
  background-color: rgba(0, 0, 0, 0.6);
}

/* 愛心圖標的顏色控制 */
.wishlist-button svg {
  fill: white; /* 預設愛心顏色為白色 */
  transition: fill 0.2s ease; /* 為 fill 屬性添加過渡效果 */
}

/* 當滑鼠懸停在按鈕上且未收藏時，SVG 的顏色變為 red-400 的效果 */
.wishlist-button:not([fill="red"]):hover svg {
  /* 檢查非紅色的情況下 hover */
  fill: #f87171; /* Tailwind's red-400 */
}

/* 收藏狀態的愛心顏色由模板中的 :fill="isFavorite(...) ? 'red' : 'white'" 控制 */
/* 所以不需要額外的 .favorite class 或複雜的 CSS 規則來控制紅色狀態 */

.bar-card-content {
  padding: 16px; 
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.bar-name {
  font-size: 20px; 
  font-weight: 700;
  /* color: #333; */
  margin-bottom: 8px; 
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bar-rating-price {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px; 
}

.bar-rating {
  font-size: 14px; 
  /* color: #666;*/
  display: flex;
  align-items: center;
}

.bar-rating .star-icon {
  margin-right: 3px; 
}

.bar-price {
  font-size: 16px; 
  font-weight: 600;
  /* color: #b8a28e;  */
}

.bar-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12px; 
  margin-bottom: 12px; 
}

.bar-tag {
  background-color: #f0f0f0;
  color: #495057; 
  padding: 5px 11px; 
  border-radius: 16px; 
  font-size: 13px; 
  white-space: nowrap;
}

.bar-hours {
  font-size: 14px; 
  /* color: #888;  */
  margin-top: auto;
}
</style>