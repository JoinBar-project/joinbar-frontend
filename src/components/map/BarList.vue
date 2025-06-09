<template>
  <div class="bar-list-wrapper">
    <div v-if="bars.length === 0" class="text-gray-600 no-results">
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
            @click.stop="emitToggleWishlist(bar.place_id)"
            :aria-label="bar.isWishlisted ? '取消收藏' : '加入收藏'"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-6 h-6"
              :fill="bar.isWishlisted ? 'red' : 'white'"
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
          <h3 class="text-gray-900 bar-name">{{ bar.name }}</h3>
          <div class="bar-rating-price">
            <span class="text-gray-700 bar-rating"
              >⭐️ {{ bar.rating || "N/A" }}</span
            >
            <span class="ml-1 text-gray-700 bar-reviews">
              ({{ bar.reviews || "0" }} 評論)</span
            >
            <span class="text-orange-700 bar-price"
              >NT$ {{ bar.priceRange || "???" }}</span
            >
          </div>

          <div v-if="bar.tags && bar.tags.length" class="bar-tags">
            <span
              v-for="(tag, index) in bar.tags"
              :key="index"
              class="text-gray-600 bar-tag"
              >{{ tag }}</span
            >
          </div>
          <div class="text-gray-700 bar-hours">
            {{
              bar.openingHours &&
              bar.openingHours.weekday_text &&
              bar.openingHours.weekday_text.length > 0
                ? bar.openingHours.weekday_text[0]
                : bar.openingHours
                  ? "營業時間待提供"
                  : "未提供營業時間"
            }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch } from "vue";
import type { PropType } from "vue";
import { Bar } from "@/types"; // 假設你定義了 Bar 介面，並統一引入

// --- Props 與 Emits ---
interface BarListProps {
  bars: Bar[]; // 從父組件接收的酒吧數據列表，現在 Bar 類型包含了 isWishlisted
}
const props = withDefaults(defineProps<BarListProps>(), {
  bars: () => [],
});

interface BarListEmits {
  (e: "bar-selected", bar: Bar): void; // 當點擊酒吧卡片時，發出事件並帶上酒吧數據
  (e: "toggle-wishlist", placeId: string): void; // 當點擊收藏按鈕時，發出事件並帶上 place_id
}
const emit = defineEmits<BarListEmits>();

// ----------------------------------------------------------------------
// 事件處理函式
// ----------------------------------------------------------------------

// 選中酒吧並發送事件給父組件
const selectBar = (bar: Bar) => {
  emit("bar-selected", bar);
};

// 切換酒吧的收藏狀態，現在直接發出事件
const emitToggleWishlist = (placeId: string | undefined) => {
  if (!placeId) {
    console.warn("無法收藏/取消收藏，因為 place_id 不存在。");
    return;
  }
  emit("toggle-wishlist", placeId);
};

// ----------------------------------------------------------------------
// Vue 生命週期與監聽器 (僅用於偵錯，實際應用可能移除)
// ----------------------------------------------------------------------

watch(
  () => props.bars,
  (newBars) => {
    console.log("BarList 接收到的 bars prop 並更新列表:", newBars.length);
  },
  { immediate: true }
);
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
  border-radius: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
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
  box-shadow: 0 0 0 2px rgba(184, 162, 142, 0.2);
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

/* 收藏狀態的愛心顏色由模板中的 :fill="bar.isWishlisted ? 'red' : 'white'" 控制 */
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
