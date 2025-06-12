<template>
  <div class="text-gray-800 filter-panel-container">
    <div class="filter-header">
      <h2 class="filter-title">篩選</h2>
      <button @click="closePanel" class="close-button">
        <img
          src="@/assets/icons/mapicons/close-button.svg"
          alt="關閉"
          class="icon close-icon"
        />
      </button>
    </div>

    <div
      class="applied-filters-list-wrapper"
      v-if="appliedFiltersForDisplay.length > 0"
    >
      <div
        v-for="(filterItem, index) in appliedFiltersForDisplay"
        :key="index"
        class="applied-filter-tag"
      >
        {{ filterItem.label }}
        <button
          @click="removeAppliedFilter(filterItem.type, filterItem.value)"
          class="remove-filter-button"
        ></button>
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
      <label class="text-gray-800 filter-label">營業時間</label>
      <div class="time-inputs-container">
        <div class="time-input-group">
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
      <button @click="resetFilters" class="action-button reset-button">
        重設
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// 使用 lang="ts" 引入 TypeScript 支援
import { ref, defineEmits, onMounted, watch, defineProps, computed } from "vue";

// 定義篩選條件的介面，與你的 filters 物件結構對應
export interface BarFilters {
  address: string;
  ratingSort: "any" | "highToLow" | "lowToHigh" | "mostPopular";
  minDistance: number;
  maxDistance: number;
  minOpenHour: number;
  minOpenMinute: number;
  maxOpenHour: number;
  maxOpenMinute: number;
  tags: string[];
}

const emit = defineEmits([
  "filter-changed", // 觸發篩選變更時發出
  "close-panel", // 關閉面板時發出
]);

const props = defineProps({
  // 從 App.vue 接收初始篩選條件，以便在開啟面板時恢復上次的狀態
  initialFilters: {
    type: Object as () => BarFilters, // 明確指定類型
    default: () => ({
      address: "any",
      ratingSort: "any",
      minDistance: 0,
      maxDistance: 5000,
      minOpenHour: 0,
      minOpenMinute: 0,
      maxOpenHour: 24,
      maxOpenMinute: 0,
      tags: [],
    }),
  },
});

// --- 響應式狀態，用於保存當前篩選條件 ---
// 使用 props.initialFilters 初始化本地狀態
const filters = ref<BarFilters>({ ...props.initialFilters });

const popularTags: string[] = [
  // 明確指定類型
  "信義區",
  "大安區",
  "中山區",
  "精釀啤酒",
  "創意調酒",
  "運動酒吧",
  "秘密基地",
  "約會小酌",
  "現場表演",
  "高空美景",
  "大型螢幕",
  "觀賽熱點",
  "居酒屋",
  "爵士樂",
  "復古",
];

// ----------------------------------------------------------------------
// 計算屬性
// ----------------------------------------------------------------------

// 格式化已套用篩選條件以供顯示
const appliedFiltersForDisplay = computed(() => {
  const displayFilters: {
    label: string;
    type: keyof BarFilters | "distance" | "openHour";
    value: any;
  }[] = []; // 明確指定類型

  if (filters.value.address !== "any") {
    displayFilters.push({
      label: `地點: ${filters.value.address}`,
      type: "address",
      value: filters.value.address,
    });
  }

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

  // 距離篩選只在 minDistance 不為 0 或 maxDistance 不為 5000 時顯示
  if (filters.value.minDistance !== 0 || filters.value.maxDistance !== 5000) {
    const min = filters.value.minDistance;
    const max = filters.value.maxDistance;
    displayFilters.push({
      label: `距離: ${min} - ${max} 公尺`,
      type: "distance", // 自定義類型，用於移除邏輯
      value: { min, max },
    });
  }

  // 營業時間顯示格式化
  // 只有當營業時間篩選條件不為預設值時才顯示
  if (
    filters.value.minOpenHour !== 0 ||
    filters.value.minOpenMinute !== 0 ||
    filters.value.maxOpenHour !== 24 ||
    filters.value.maxOpenMinute !== 0
  ) {
    const formatTime = (h: number, m: number): string => {
      // 明確指定類型
      const hour = String(h).padStart(2, "0");
      const minute = String(m).padStart(2, "0");
      return `${hour}:${minute}`;
    };
    const minTime = formatTime(
      filters.value.minOpenHour,
      filters.value.minOpenMinute
    );
    const maxTime = formatTime(
      filters.value.maxOpenHour,
      filters.value.maxOpenMinute
    );

    displayFilters.push({
      label: `營業時間: ${minTime} - ${maxTime}`,
      type: "openHour", // 自定義類型，用於移除邏輯
      value: {
        // 儲存完整的時間數值，方便移除時還原
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
        type: "tags", // 修正：改為 "tags" 以符合 BarFilters 介面
        value: tag,
      });
    });
  }

  return displayFilters;
});

// ----------------------------------------------------------------------
// 事件處理函式
// ----------------------------------------------------------------------

// 移除已套用的單一篩選條件
const removeAppliedFilter = (
  type: keyof BarFilters | "distance" | "openHour" | "tags",
  value: any
) => {
  // 明確指定類型
  // 根據 type 和 value 來重置 filters 中的對應屬性
  switch (type) {
    case "address":
      filters.value.address = "any";
      break;
    case "ratingSort":
      filters.value.ratingSort = "any";
      break;
    case "distance":
      filters.value.minDistance = 0;
      filters.value.maxDistance = 5000;
      break;
    case "openHour":
      filters.value.minOpenHour = 0;
      filters.value.minOpenMinute = 0;
      filters.value.maxOpenHour = 24;
      filters.value.maxOpenMinute = 0;
      break;
    case "tags":
      filters.value.tags = filters.value.tags.filter((t) => t !== value);
      break;
  }
  applyFilters(); // 移除後重新應用篩選
};

// 更新距離數值輸入框，並同步篩選
const updateDistance = () => {
  // 確保 min <= max
  if (filters.value.minDistance > filters.value.maxDistance) {
    filters.value.minDistance = filters.value.maxDistance;
  }
  // 限制數值在有效範圍內
  filters.value.minDistance = Math.max(
    0,
    Math.min(filters.value.minDistance, 5000)
  );
  filters.value.maxDistance = Math.max(
    0,
    Math.min(filters.value.maxDistance, 5000)
  );

  applyFilters();
};

// 更新距離滑動條，並同步篩選
const updateDistanceRange = () => {
  // 當滑桿改變時，只需更新 maxDistance，minDistance 由 watch 確保不會超過 maxDistance
  // 但我們也確保 minDistance 不會大於新的 maxDistance
  if (filters.value.minDistance > filters.value.maxDistance) {
    filters.value.minDistance = filters.value.maxDistance;
  }
  applyFilters();
};

// 更新營業時間輸入框，並同步篩選
const updateOpenHours = () => {
  // 確保小時和分鐘在有效範圍內
  filters.value.minOpenHour = Math.max(
    0,
    Math.min(Number(filters.value.minOpenHour), 23)
  );
  filters.value.minOpenMinute = Math.max(
    0,
    Math.min(Number(filters.value.minOpenMinute), 59)
  );
  filters.value.maxOpenHour = Math.max(
    0,
    Math.min(Number(filters.value.maxOpenHour), 24)
  );
  filters.value.maxOpenMinute = Math.max(
    0,
    Math.min(Number(filters.value.maxOpenMinute), 59)
  );

  // 處理 24:00 (如果 maxOpenHour 是 24，則 maxOpenMinute 必須是 0)
  if (filters.value.maxOpenHour === 24) {
    filters.value.maxOpenMinute = 0;
  }
  // 如果 minOpenHour 和 minOpenMinute 大於 maxOpenHour 和 maxOpenMinute，進行調整
  if (
    filters.value.minOpenHour * 60 + filters.value.minOpenMinute >
    filters.value.maxOpenHour * 60 + filters.value.maxOpenMinute
  ) {
    // 簡單的處理：將最大時間設為最小時間
    filters.value.maxOpenHour = filters.value.minOpenHour;
    filters.value.maxOpenMinute = filters.value.minOpenMinute;
  }

  applyFilters();
};

// 切換標籤選中狀態
const toggleTag = (tag: string) => {
  // 明確指定類型
  if (!Array.isArray(filters.value.tags)) {
    filters.value.tags = [];
  }
  const index = filters.value.tags.indexOf(tag);
  if (index > -1) {
    filters.value.tags.splice(index, 1);
  } else {
    filters.value.tags.push(tag);
  }
  applyFilters();
};

// 觸發篩選條件變更事件
const applyFilters = () => {
  // 發送一個包含所有當前篩選狀態的完整物件
  emit("filter-changed", { ...filters.value });
};

// 重設所有篩選條件為預設值
const resetFilters = () => {
  filters.value = {
    address: "any",
    ratingSort: "any",
    minDistance: 0,
    maxDistance: 5000,
    minOpenHour: 0,
    minOpenMinute: 0,
    maxOpenHour: 24,
    maxOpenMinute: 0,
    tags: [],
  };
  applyFilters(); // 重設後立即應用篩選
};

// 關閉篩選面板
const closePanel = () => {
  emit("close-panel");
};

// ----------------------------------------------------------------------
// Vue 生命週期與監聽器
// ----------------------------------------------------------------------

// 監聽父組件傳入的 initialFilters，並更新本地篩選狀態
watch(
  () => props.initialFilters,
  (newFilters) => {
    // 這裡我們直接賦值，確保本地狀態與 prop 同步
    // 如果你希望更精細的控制（例如只更新某些屬性），可以手動遍歷
    filters.value = { ...newFilters };
  },
  { deep: true, immediate: true } // 深度監聽，組件初始化時也執行一次
);

onMounted(() => {
  // 在組件掛載時，確保 initialFilters 已經應用到本地狀態
  // 並發出一次初始篩選事件（如果需要）
  // 由於 watch 設置了 immediate: true，這行通常可以省略，因為 watch 會在 mount 時觸發
  // applyFilters(); // 根據你的需求決定是否在 mount 時立即發出一次
});
</script>

<style scoped>
/* 新增或修改營業時間相關的樣式 */
.time-inputs-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 13px;
}

.time-input-group {
  display: flex;
  align-items: center;
  gap: 3px;
}

.time-number-input {
  width: 45px;
  padding: 10px 6px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 15px;
  text-align: center;
  -moz-appearance: textfield;
}
.time-number-input::-webkit-outer-spin-button,
.time-number-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.time-input-group span {
  font-size: 15px;
  color: #555;
}

.time-input-hint {
  font-size: 14px;
  color: #888;
  margin-top: 8px;
  text-align: center;
}

.applied-filters-list-wrapper {
  margin-bottom: 24px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 5px;
}

.applied-filter-tag {
  display: flex;
  align-items: center;
  background-color: #f4dad9;
  color: black;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 14px;
  white-space: nowrap;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.remove-filter-button {
  background: none;
  border: none;
  color: black;
  margin-left: 8px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.remove-filter-button:hover {
  opacity: 1;
}

.filter-panel-container {
  padding: 24px;
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
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.filter-title {
  font-size: 26px;
  font-weight: 700;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 29px;
  color: #888;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition:
    background-color 0.2s,
    color 0.2s;
}

.close-button:hover {
  background-color: #f0f0f0;
  color: #555;
}

.close-button .close-icon {
  width: 100%;
  height: 100%;
}

.filter-section {
  margin-bottom: 32px;
}

.filter-label {
  display: block;
  font-weight: 600;
  color: #333;
  margin-bottom: 13px;
  font-size: 17px;
}

.filter-select {
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 15px;
  color: #555;
  background-color: #fff;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-25.3%200L146.2%20188.2%2030.7%2069.4a17.6%2017.6%200%200%200-25.3%200%2017.6%2017.6%200%200%200%200%2025.3l130.8%20129.8c6.8%206.7%2017.7%206.7%2024.5%200l130.8-129.8c6.9-6.8%206.9-17.7%200-25.4z%22%2F%3E%3C%2Fsvg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 0.8em auto;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: border-color 0.2s;
}

.filter-select:focus {
  outline: none;
  border-color: #f4dad9;
  box-shadow: 0 0 0 3px rgba(213, 181, 178, 0.3);
}

.range-inputs {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 13px;
}

.range-number-input {
  width: 45%;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 15px;
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
  margin-top: 8px;
}

.range-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  background: #f4dad9;
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
  font-size: 14px;
  color: #666;
  margin-top: 8px;
}

.tags-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.tag-button,
.tag-button-active {
  padding: 10px 16px;
  border-radius: 24px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition:
    background-color 0.2s,
    border-color 0.2s,
    color 0.2s,
    box-shadow 0.2s;
  white-space: nowrap;
}

.tag-button {
  background-color: #f4dad9;
  color: #555;
  border: 1px solid #e0e0e0;
}

.tag-button:hover {
  background-color: #dfc2c0;
  border-color: #ccc;
}

.tag-button-active {
  background-color: #f4dad9;
  color: white;
  border-color: #f4dad9;
  box-shadow: 0 2px 5px rgba(223, 194, 192, 0.4);
}

.tag-button-active:hover {
  background-color: #dfc2c0;
  border-color: #dfc2c0;
}

.filter-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.action-button {
  padding: 11px 9px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background-color 0.2s,
    color 0.2s,
    box-shadow 0.2s;
}

.reset-button {
  background-color: #f4dad9;
  color: #555;
  border: 1px solid #dfc2c0;
}

.reset-button:hover {
  background-color: #dfc2c0;
  color: #333;
}

@media (max-width: 600px) {
  .filter-panel-container {
    width: 100vw;
    right: 0;
    left: 0;
    padding: 16px;
  }
}
</style>
