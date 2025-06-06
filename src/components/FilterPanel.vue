<template>
  <div class="filter-panel-container text-gray-800">
    <div class="filter-header">
      <h2 class="filter-title">篩選</h2>
      <button @click="closePanel" class="close-button">X</button>
    </div>

    <div class="applied-filters-list-wrapper" v-if="appliedFiltersForDisplay.length > 0">
      <div
        v-for="(filterItem, index) in appliedFiltersForDisplay"
        :key="index"
        class="applied-filter-tag"
      >
        {{ filterItem.label }}
        <button @click="removeAppliedFilter(filterItem.type, filterItem.value)" class="remove-filter-button">X</button>
      </div>
    </div>
    <div class="filter-section">
      <label for="addressFilter" class="filter-label">地點</label>
      <select
        id="addressFilter"
        v-model="filters.address"
        @change="applyFilters"
        class="filter-select"
      >
        <option value="any">任何地方</option>
        <option value="信義區">信義區</option>
        <option value="大安區">大安區</option>
        <option value="中山區">中山區</option>
        <option value="松山區">松山區</option>
        <option value="萬華區">萬華區</option>
        <option value="士林區">士林區</option>
      </select>
    </div>

    <div class="filter-section">
      <label for="ratingFilter" class="filter-label">評價</label>
      <select
        id="ratingFilter"
        v-model="filters.ratingSort"
        @change="applyFilters"
        class="filter-select"
      >
        <option value="any">任何</option>
        <option value="highToLow">由高到低</option>
        <option value="lowToHigh">由低到高</option>
        <option value="mostPopular">近期最受歡迎</option>
      </select>
    </div>

    <div class="filter-section">
      <label class="filter-label">距離 (公尺)</label>
      <div class="range-inputs">
        <input
          type="number"
          v-model.number="filters.minDistance"
          @input="updateDistance"
          class="range-number-input"
          min="0"
          max="5000"
        />
        <span>-</span>
        <input
          type="number"
          v-model.number="filters.maxDistance"
          @input="updateDistance"
          class="range-number-input"
          min="0"
          max="5000"
        />
      </div>
      <input
        type="range"
        v-model.number="filters.maxDistance"
        @input="updateDistanceRange"
        class="range-slider"
        min="0"
        max="5000"
        step="100"
      />
      <div class="range-labels">
        <span>0</span>
        <span>5000</span>
      </div>
    </div>

    <div class="filter-section">
      <label class="filter-label text-gray-800">營業時間</label>
      <div class="time-inputs-container"> <div class="time-input-group">
          <input
            type="number"
            v-model.number="filters.minOpenHour"
            @input="updateOpenHours"
            class="time-number-input"
            min="0"
            max="23"
          />
          <span>:</span>
          <input
            type="number"
            v-model.number="filters.minOpenMinute"
            @input="updateOpenHours"
            class="time-number-input"
            min="0"
            max="59"
          />
        </div>
        <span>-</span>
        <div class="time-input-group">
          <input
            type="number"
            v-model.number="filters.maxOpenHour"
            @input="updateOpenHours"
            class="time-number-input"
            min="0"
            max="24"
          />
          <span>:</span>
          <input
            type="number"
            v-model.number="filters.maxOpenMinute"
            @input="updateOpenHours"
            class="time-number-input"
            min="0"
            max="59"
          />
        </div>
      </div>
    </div>

    <div class="filter-section">
      <label class="filter-label">熱門推薦</label>
      <div class="tags-grid">
        <button
          v-for="tag in popularTags"
          :key="tag"
          :class="{
            'tag-button-active': filters.tags.includes(tag),
            'tag-button': !filters.tags.includes(tag),
          }"
          @click="toggleTag(tag)"
        >
          {{ tag }}
        </button>
      </div>
    </div>

    <div class="filter-actions">
      <button @click="resetFilters" class="action-button reset-button">重設</button>
    </div>
  </div>
</template>

<script setup>
import { ref, defineEmits, onMounted, watch, defineProps, computed } from 'vue'

const emit = defineEmits(['filter-changed', 'close-panel', 'remove-applied-filter'])

const props = defineProps({
  initialFilters: {
    type: Object,
    default: () => ({
      address: 'any',
      ratingSort: 'any',
      minDistance: 0,
      maxDistance: 5000,
      minOpenHour: 0,
      minOpenMinute: 0, // 新增分鐘預設值
      maxOpenHour: 24,
      maxOpenMinute: 0, // 新增分鐘預設值
      tags: [],
    }),
  },
})

const filters = ref({
  address: 'any',
  ratingSort: 'any',
  minDistance: 0,
  maxDistance: 5000,
  minOpenHour: 0,
  minOpenMinute: 0, // 初始化
  maxOpenHour: 24,
  maxOpenMinute: 0, // 初始化
  tags: [],
})

const appliedFiltersForDisplay = computed(() => {
  const displayFilters = [];

  // 地點篩選
  if (filters.value.address !== "any") {
    displayFilters.push({
      label: `地點: ${filters.value.address}`,
      type: "address",
      value: filters.value.address,
    });
  }

  // 評價排序
  if (filters.value.ratingSort !== "any") {
    let ratingLabel = "";
    switch (filters.value.ratingSort) {
      case "highToLow":
        ratingLabel = "由高到低";
        break;
      case "lowToHigh":
        ratingLabel = "由低到高";
        break;
      case "mostPopular":
        ratingLabel = "近期最受歡迎";
        break;
    }
    displayFilters.push({
      label: `評價: ${ratingLabel}`,
      type: "ratingSort",
      value: filters.value.ratingSort,
    });
  }

  // 距離篩選
  if (filters.value.minDistance !== 0 || filters.value.maxDistance !== 5000) {
    const min = filters.value.minDistance;
    const max = filters.value.maxDistance;
    displayFilters.push({
      label: `距離: ${min} - ${max} 公尺`,
      type: "distance",
      value: { min, max },
    });
  }

  // 營業時間篩選 (更新此處的顯示邏輯，以適應分鐘)
  if (filters.value.minOpenHour !== 0 || filters.value.minOpenMinute !== 0 ||
      filters.value.maxOpenHour !== 24 || filters.value.maxOpenMinute !== 0) {
    
    const formatTime = (h, m) => {
      const hour = String(h).padStart(2, '0');
      const minute = String(m).padStart(2, '0');
      return `${hour}:${minute}`;
    };

    const minTime = formatTime(filters.value.minOpenHour, filters.value.minOpenMinute);
    const maxTime = formatTime(filters.value.maxOpenHour, filters.value.maxOpenMinute);
    
    displayFilters.push({
      label: `營業時間: ${minTime} - ${maxTime}`,
      type: "openHour", // 類型仍為 openHour，但 value 包含更多信息
      value: {
        minHour: filters.value.minOpenHour,
        minMinute: filters.value.minOpenMinute,
        maxHour: filters.value.maxOpenHour,
        maxMinute: filters.value.maxOpenMinute,
      },
    });
  }

  // 標籤篩選
  if (Array.isArray(filters.value.tags)) {
    filters.value.tags.forEach((tag) => {
      displayFilters.push({
        label: `標籤: ${tag}`,
        type: "tag",
        value: tag,
      });
    });
  }

  return displayFilters;
});


const removeAppliedFilter = (type, value) => {
  emit('remove-applied-filter', { type, value });
};


const popularTags = [
  '信義區', '大安區', '中山區', '精釀啤酒', '創意調酒', '運動酒吧',
  '秘密基地', '約會小酌', '現場表演', '高空美景', '餐點美味', '多種啤酒',
  '輕鬆氛圍', '獨特調酒', '品味之選', '大型螢幕', '觀賽熱點', '復古',
  '主題', '小酌',
]

// --- 輔助函數 ---

const updateDistance = () => {
  filters.value.minDistance = Number(filters.value.minDistance)
  filters.value.maxDistance = Number(filters.value.maxDistance)

  if (filters.value.minDistance > filters.value.maxDistance) {
    filters.value.minDistance = filters.value.maxDistance
  }
  filters.value.minDistance = Math.max(0, Math.min(filters.value.minDistance, 5000))
  filters.value.maxDistance = Math.max(0, Math.min(filters.value.maxDistance, 5000))

  applyFilters()
}

const updateDistanceRange = () => {
  if (filters.value.minDistance > filters.value.maxDistance) {
    filters.value.minDistance = filters.value.maxDistance
  }
  applyFilters()
}

// 針對營業時間輸入的更新邏輯
const updateOpenHours = () => {
  // 確保小時數在 0-23/24 之間，分鐘數在 0-59 之間
  filters.value.minOpenHour = Math.max(0, Math.min(Number(filters.value.minOpenHour), 23));
  filters.value.minOpenMinute = Math.max(0, Math.min(Number(filters.value.minOpenMinute), 59));
  filters.value.maxOpenHour = Math.max(0, Math.min(Number(filters.value.maxOpenHour), 24));
  filters.value.maxOpenMinute = Math.max(0, Math.min(Number(filters.value.maxOpenMinute), 59));

  // 特殊處理 24:00 (如果 maxOpenHour 是 24，則 maxOpenMinute 必須是 0)
  if (filters.value.maxOpenHour === 24 && filters.value.maxOpenMinute !== 0) {
    filters.value.maxOpenMinute = 0;
  }

  // 跨日邏輯仍然完全交給 MapView 處理
  // FilterPanel 僅負責確保輸入值在有效範圍內

  applyFilters()
}


const toggleTag = (tag) => {
  if (!Array.isArray(filters.value.tags)) {
      filters.value.tags = [];
  }
  const index = filters.value.tags.indexOf(tag)
  if (index > -1) {
    filters.value.tags.splice(index, 1)
  } else {
    filters.value.tags.push(tag)
  }
  applyFilters()
}

const applyFilters = () => {
  // 發送包含小時和分鐘的完整篩選物件
  emit('filter-changed', { ...filters.value })
}

const resetFilters = () => {
  filters.value = {
    address: 'any',
    ratingSort: 'any',
    minDistance: 0,
    maxDistance: 5000,
    minOpenHour: 0,
    minOpenMinute: 0,
    maxOpenHour: 24,
    maxOpenMinute: 0,
    tags: [],
  }
  applyFilters()
}

const closePanel = () => {
  emit('close-panel')
}

watch(
  () => props.initialFilters,
  (newFilters) => {
    // 這裡的深層比較需要更仔細，因為 now filters.value 是一個包含更多屬性的物件
    // 簡單的 JSON.stringify 可能足夠，但最好逐個屬性比較或使用 Lodash 的 isEqual
    // 或者只在 `initialFilters` 的屬性發生變化時才更新
    if (newFilters) {
        // 使用一個更穩健的比較方式，避免無限循環或不必要的更新
        let needsUpdate = false;
        for (const key in newFilters) {
            if (JSON.stringify(newFilters[key]) !== JSON.stringify(filters.value[key])) {
                needsUpdate = true;
                break;
            }
        }
        if (needsUpdate) {
            filters.value = { ...newFilters };
        }
    }
  },
  { deep: true, immediate: true }
)

onMounted(() => {
  applyFilters();
})
</script>

<style scoped>
/* 新增或修改營業時間相關的樣式 */
.time-inputs-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem; /* 小時-分鐘組之間的間距 */
  margin-bottom: 0.8rem;
}

.time-input-group {
  display: flex;
  align-items: center;
  gap: 0.2rem; /* 小時與分鐘輸入框之間的冒號間距 */
}

.time-number-input {
  width: 45px; /* 調整寬度以容納兩位數字 */
  padding: 0.6rem 0.4rem; /* 調整內邊距 */
  border: 1px solid #e0e0e0;
  border-radius: 0.5rem;
  font-size: 0.95rem;
  text-align: center;
  -moz-appearance: textfield;
}
.time-number-input::-webkit-outer-spin-button,
.time-number-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.time-input-group span {
  font-size: 0.95rem;
  color: #555;
}

.time-input-hint {
  font-size: 0.85rem;
  color: #888;
  margin-top: 0.5rem;
  text-align: center;
}

/* 其他現有樣式，保持不變 */
.applied-filters-list-wrapper {
  margin-bottom: 1.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 5px;
}

.applied-filter-tag {
  display: flex;
  align-items: center;
  background-color: #b8a28e;
  color: white;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
  white-space: nowrap;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.remove-filter-button {
  background: none;
  border: none;
  color: white;
  margin-left: 8px;
  font-size: 0.9rem;
  font-weight: bold;
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.remove-filter-button:hover {
  opacity: 1;
}

.filter-panel-container {
  padding: 1.5rem;
  background-color: #ffffff;
  height: 100%;
  overflow-y: auto;
  box-shadow: -4px 0 10px rgba(0, 0, 0, 0.1);
  position: absolute;
  top: 0;
  right: 0;
  width: 320px;
  max-width: 90vw;
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f0f0f0;
}

.filter-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.8rem;
  color: #888;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition:
    background-color 0.2s,
    color 0.2s;
}

.close-button:hover {
  background-color: #f0f0f0;
  color: #555;
}

.filter-section {
  margin-bottom: 2rem;
}

.filter-label {
  display: block;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.8rem;
  font-size: 1.05rem;
}

.filter-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 0.5rem;
  font-size: 0.95rem;
  color: #555;
  background-color: #fff;
  appearance: none;
  background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-25.3%200L146.2%20188.2%2030.7%2069.4a17.6%2017.6%200%200%200-25.3%200%2017.6%2017.6%200%200%200%200%2025.3l130.8%20129.8c6.8%206.7%2017.7%206.7%2024.5%200l130.8-129.8c6.9-6.8%206.9-17.7%200-25.4z%22%2F%3E%3C%2Fsvg%3E');
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 0.8em auto;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: border-color 0.2s;
}

.filter-select:focus {
  outline: none;
  border-color: #decdd5;
  box-shadow: 0 0 0 3px rgba(222, 205, 213, 0.3);
}

.range-inputs {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.8rem;
}

.range-number-input {
  width: 45%;
  padding: 0.6rem;
  border: 1px solid #e0e0e0;
  border-radius: 0.5rem;
  font-size: 0.95rem;
  text-align: center;
  -moz-appearance: textfield;
}
.range-number-input::-webkit-outer-spin-button,
.range-number-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.range-slider {
  width: 100%;
  -webkit-appearance: none;
  appearance: none;
  height: 8px;
  background: #f0f0f0;
  outline: none;
  border-radius: 5px;
  margin-top: 0.5rem;
}

.range-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  background: #b8a28e;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.range-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: #b8a28e;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.range-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #666;
  margin-top: 0.5rem;
}

.tags-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.tag-button,
.tag-button-active {
  padding: 0.6rem 1rem;
  border-radius: 1.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition:
    background-color 0.2s,
    border-color 0.2s,
    color 0.2s,
    box-shadow 0.2s;
  white-space: nowrap;
}

.tag-button {
  background-color: #f5f5f5;
  color: #555;
  border: 1px solid #e0e0e0;
}

.tag-button:hover {
  background-color: #e0e0e0;
  border-color: #ccc;
}

.tag-button-active {
  background-color: #b8a28e;
  color: white;
  border-color: #b8a28e;
  box-shadow: 0 2px 5px rgba(184, 162, 142, 0.4);
}

.tag-button-active:hover {
  background-color: #a08d7a;
  border-color: #a08d7a;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid #f0f0f0;
}

.action-button {
  padding: 0.85rem 1.25rem;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background-color 0.2s,
    color 0.2s,
    box-shadow 0.2s;
}

.reset-button {
  background-color: #f0f0f0;
  color: #555;
  border: 1px solid #e0e0e0;
}

.reset-button:hover {
  background-color: #e5e5e5;
  color: #333;
}

@media (max-width: 600px) {
  .filter-panel-container {
    width: 100vw;
    right: 0;
    left: 0;
    padding: 1rem;
  }
}
</style>