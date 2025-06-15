<template>
  <div class="bar-list-wrapper">
    <div v-if="bars.length === 0" class="no-results">
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
            :src="bar.imageUrl || defaultPlaceholderImage"
            :alt="bar.name"
            class="bar-image"
            loading="lazy"
            @error="handleImageError"
          />
          <button
            class="wishlist-button"
            @click.stop="emitToggleWishlist(bar.place_id, bar.isWishlisted)"
            :aria-label="bar.isWishlisted ? '取消收藏' : '加入收藏'"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="wishlist-icon"
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
          <h3 class="bar-name">{{ bar.name }}</h3>
          <div class="bar-rating-price">
            <span class="bar-rating">⭐️ {{ bar.rating || "N/A" }}</span>
            <span class="bar-reviews"> ({{ bar.user_ratings_total || "0" }} 評論)</span>
            <span class="bar-price">NT$ {{ bar.priceRange || "???" }}</span>
          </div>

          <div v-if="bar.tags && bar.tags.length" class="bar-tags">
            <span v-for="tag in bar.tags" :key="tag" class="bar-tag">{{
              tag
            }}</span>
          </div>

          <div class="bar-hours">
            {{ bar.openingHoursText || "營業時間未提供" }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { watch, ref } from "vue";

const props = defineProps({
  bars: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["bar-selected", "toggle-wishlist"]);

const defaultPlaceholderImage =
  "https://placehold.co/300x200/decdd5/860914?text=Bar+Image";

const handleImageError = (event) => {
  event.target.src = defaultPlaceholderImage;
  event.target.onerror = null;
};

// 移除 getOpeningHourText 函數，直接使用 bar.openingHoursText
// const getOpeningHourText = (bar) => {
//   if (bar.openingHours?.weekdayText?.length > 0) {
//     return bar.openingHours.weekdayText[0];
//   } else if (bar.openingHours) {
//     return "營業時間待提供";
//   } else {
//     return "未提供營業時間";
//   }
// };

const selectBar = (bar) => {
  emit("bar-selected", bar);
};

// 修改 emitToggleWishlist，直接傳遞當前的 isWishlisted 狀態
const emitToggleWishlist = (placeId, isWishlisted) => {
  if (!placeId) {
    console.warn("無法收藏/取消收藏，因為 place_id 不存在。");
    return;
  }
  emit("toggle-wishlist", { placeId, isFavorite: isWishlisted });
};

watch(
  () => props.bars,
  (newBars) => {
    console.log("BarList 接收到的 bars prop 並更新列表:", newBars.length);
  },
  { immediate: true }
);
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
}

.bar-cards-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
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
}

.bar-image {
  width: 100%;
  height: 100%;
  object-fit: cover; /* 修改：確保圖片填充整個區域 */
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
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
  fill: white;
  transition: fill 0.2s ease;
}

.wishlist-button:not([fill="red"]):hover .wishlist-icon {
  fill: #f87171;
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
  /* justify-content: space-between; */ /* 移除這個，讓元素自然排列 */
  align-items: center;
  margin-bottom: 8px;
  gap: 8px; /* 新增：元素間距 */
}

.bar-rating {
  font-size: 14px;
  color: #4a5568;
  display: flex;
  align-items: center;
  white-space: nowrap; /* 避免換行 */
}

.bar-reviews {
  /* margin-left: 4px; */ /* 移除這個，由 gap 控制間距 */
  font-size: 14px;
  color: #4a5568;
  white-space: nowrap; /* 避免換行 */
}

.bar-price {
  font-size: 16px;
  font-weight: 600;
  color: #ea580c;
  margin-left: auto; /* 將價格推到最右邊 */
  white-space: nowrap; /* 避免換行 */
}

.bar-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px; /* 調整間距，看起來更緊湊 */
  margin-bottom: 12px;
}

.bar-tag {
  background-color: #f0f0f0;
  color: #4a5568;
  padding: 4px 8px; /* 調整 padding */
  border-radius: 12px; /* 調整圓角 */
  font-size: 12px; /* 調整字體大小 */
  white-space: nowrap;
}

.bar-hours {
  font-size: 14px;
  color: #4a5568;
  margin-top: auto;
}
</style>