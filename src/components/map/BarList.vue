<template>
  <div class="bar-list-wrapper">
    <div v-if="barsWithFavoriteStatus.length === 0" class="no-results">
      目前沒有符合條件的酒吧。
    </div>
    <div v-else class="bar-cards-list">
      <div
        v-for="bar in barsWithFavoriteStatus"
        :key="bar.place_id || bar.id"
        class="bar-card"
        @click="selectBar(bar)"
      >
        <div class="bar-card-image">
          <img
            :src="
              bar.images && bar.images.length > 0
                ? bar.images[0]
                : bar.imageUrl || defaultPlaceholderImage
            "
            :alt="bar.name || 'Bar'"
            class="bar-image"
            loading="lazy"
            @error="handleImageError"
          />
          <button
            class="wishlist-button"
            @click.stop="emitToggleWishlist(bar)"
            :aria-label="bar.isWishlisted ? '取消收藏' : '加入收藏'"
            :disabled="loading"
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
            <span class="bar-reviews"> ({{ bar.reviews || 0 }} 評論)</span>
          </div>

          <div v-if="bar.tags && bar.tags.length" class="bar-tags">
            <span v-for="tag in bar.tags || []" :key="tag" class="bar-tag">{{
              getTagLabel(tag)
            }}</span>
          </div>
          <div class="bar-hours">
            {{ getOpeningHourText(bar) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useFavoritesStore } from "@/stores/favorites";
import { storeToRefs } from "pinia";
import placeTypeMap from "@/composables/placeTypeMap";

const props = defineProps({
  bars: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["bar-selected", "toggle-wishlist"]);

const favoritesStore = useFavoritesStore();
const { loading } = storeToRefs(favoritesStore);

// 載入收藏列表
onMounted(async () => {
  await favoritesStore.fetchFavorites();
});

// 計算每個酒吧的收藏狀態
const barsWithFavoriteStatus = computed(() => {
  return props.bars.map((bar) => {
    const identifier = bar.place_id || bar.googlePlaceId || bar.id;
    return {
      ...bar,
      isWishlisted: favoritesStore.isFavorited(identifier),
    };
  });
});

const defaultPlaceholderImage =
  "https://placehold.co/300x200/decdd5/860914?text=Bar+Image";

const handleImageError = (event) => {
  event.target.src = defaultPlaceholderImage;
  event.target.onerror = null;
};

const getOpeningHourText = (bar) => {
  if (bar.opening_hours?.weekday_text?.length > 0) {
    return bar.opening_hours.weekday_text[0];
  } else if (bar.opening_hours) {
    return "營業時間待提供";
  } else {
    return "未提供營業時間";
  }
};

const selectBar = (bar) => {
  emit("bar-selected", bar);
};

// 更新收藏切換功能
const emitToggleWishlist = async (bar) => {
  const identifier = bar.place_id || bar.googlePlaceId || bar.id;
  if (!identifier) {
    console.warn("無法收藏/取消收藏，因為缺少識別碼");
    return;
  }

  try {
    // 準備最小且正確的 barData 給 store
    const barData = {
      name: bar.name,
      place_id: bar.place_id || bar.googlePlaceId,
      googlePlaceId: bar.googlePlaceId || bar.place_id,
      id: bar.id || bar.barId,
      address: bar.formatted_address || bar.address || bar.vicinity || "",
      latitude: bar.geometry?.location
        ? typeof bar.geometry.location.lat === "function"
          ? bar.geometry.location.lat()
          : bar.geometry.location.lat
        : bar.location?.lat || bar.latitude,
      longitude: bar.geometry?.location
        ? typeof bar.geometry.location.lng === "function"
          ? bar.geometry.location.lng()
          : bar.geometry.location.lng
        : bar.location?.lng || bar.longitude,
    };
    // 使用 store 的 toggle 功能
    const newStatus = await favoritesStore.toggleFavorite(barData);
    // 通知父組件更新
    emit("toggle-wishlist", identifier);
  } catch (error) {
    console.error("Failed to toggle favorite:", error);
    alert("操作失敗，請稍後再試");
  }
};

const getTagLabel = (tag) => {
  return placeTypeMap[tag] || tag;
};
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
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
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
</style>
