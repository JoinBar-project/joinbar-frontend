<template>
  <div :class="['filter-panel', { 'filter-panel-open': true }]">
    <div class="panel-header">
      <h2 class="panel-title">篩選</h2>
      <button @click="$emit('close-panel')" class="close-button">
        <i class="fas fa-times"></i>
      </button>
    </div>

    <div class="panel-content">
      <div class="filter-section">
        <h3 class="section-title">地點</h3>
        <select v-model="filters.address" class="filter-select">
          <option value="any">任何地方</option>
          <option value="中山區">中山區</option>
          <option value="信義區">信義區</option>
          <option value="大安區">大安區</option>
          <option value="松山區">松山區</option>
          <option value="萬華區">萬華區</option>
          <option value="士林區">士林區</option>
          </select>
      </div>

      <div class="filter-section">
        <h3 class="section-title">評價</h3>
        <select v-model="filters.ratingSort" class="filter-select">
          <option value="any">任何</option>
          <option value="highToLow">評分高到低</option>
          <option value="lowToHigh">評分低到高</option>
        </select>
      </div>

      <div class="filter-section">
        <h3 class="section-title">距離 (公里)</h3>
        <div class="distance-inputs">
          <input
            type="number"
            v-model.number="filters.minDistance"
            min="0"
            step="100"
            class="distance-input"
          />
          <span>-</span>
          <input
            type="number"
            v-model.number="filters.maxDistance"
            min="0"
            step="100"
            class="distance-input"
          />
        </div>
        <input
          type="range"
          v-model.number="filters.maxDistance"
          min="0"
          max="5000"
          step="100"
          class="distance-range"
        />
        <div class="range-labels">
          <span>0</span>
          <span>5000</span>
        </div>
      </div>

      <div class="filter-section">
        <h3 class="section-title">營業時間</h3>
        <div class="time-inputs">
          <select v-model.number="filters.minOpenHour" class="time-select">
            <option v-for="h in 24" :key="h - 1" :value="h - 1">
              {{ (h - 1).toString().padStart(2, "0") }}
            </option>
          </select>
          <span>:</span>
          <select v-model.number="filters.minOpenMinute" class="time-select">
            <option value="0">00</option>
            <option value="30">30</option>
          </select>
          <span>-</span>
          <select v-model.number="filters.maxOpenHour" class="time-select">
            <option v-for="h in 25" :key="h - 1" :value="h - 1">
              {{ (h - 1).toString().padStart(2, "0") }}
            </option>
          </select>
          <span>:</span>
          <select v-model.number="filters.maxOpenMinute" class="time-select">
            <option value="0">00</option>
            <option value="30">30</option>
          </select>
        </div>
      </div>

      <div class="filter-section">
        <h3 class="section-title">熱門推薦</h3>
        <div class="tag-list">
          <button
            v-for="tag in popularTags"
            :key="tag"
            :class="['tag-button', { active: filters.tags.includes(tag) }]"
            @click="toggleTag(tag)"
          >
            {{ tag }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, defineEmits, defineProps } from "vue";

const props = defineProps({
  initialFilters: {
    type: Object,
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

const emit = defineEmits(["filter-changed", "close-panel", "remove-applied-filter"]);

// 使用 ref 來管理內部篩選狀態，並根據 props.initialFilters 初始化
const filters = ref({ ...props.initialFilters });

// 熱門推薦標籤
const popularTags = ref([
  "信義區",
  "大安區",
  "中山區",
  "精釀啤酒",
  "創意調酒",
  "運動酒吧",
  "秘密基地",
  "約會小酌",
  "現場表演",
]);

// 監聽 filters 變化，並發送 filter-changed 事件給父組件
watch(
  filters,
  (newFilters) => {
    emit("filter-changed", newFilters);
  },
  { deep: true } // 深度監聽，確保內部屬性變化也能觸發
);

// 監聽 initialFilters 變化，用於外部重置或初始化
watch(
  () => props.initialFilters,
  (newInitialFilters) => {
    filters.value = { ...newInitialFilters };
  },
  { deep: true }
);

function toggleTag(tag) {
  const index = filters.value.tags.indexOf(tag);
  if (index > -1) {
    filters.value.tags.splice(index, 1); // 移除標籤
  } else {
    filters.value.tags.push(tag); // 添加標籤
  }
}
</script>

<style scoped>
/* 篩選面板基本樣式 */
.filter-panel {
  position: fixed;
  top: 0;
  right: -400px; /* 初始狀態：隱藏在右側 */
  width: 350px; /* 面板寬度 */
  height: 100vh;
  background-color: #fff;
  box-shadow: -4px 0 15px rgba(0, 0, 0, 0.1);
  transition: right 0.3s ease-in-out;
  z-index: 1000; /* 確保在其他內容之上 */
  display: flex;
  flex-direction: column;
}

.filter-panel-open {
  right: 0; /* 打開時移動到視窗右側 */
}

/* 面板頭部 */
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  background-color: #f8f8f8;
}

.panel-title {
  margin: 0;
  font-size: 24px;
  color: #333;
  font-weight: bold;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  padding: 5px;
  transition: color 0.2s;
}

.close-button:hover {
  color: #333;
}

/* 面板內容 */
.panel-content {
  flex-grow: 1;
  padding: 20px;
  overflow-y: auto; /* 內容過多時可滾動 */
}

.filter-section {
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 1px dashed #eee;
}

.filter-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.section-title {
  font-size: 18px;
  color: #555;
  margin-top: 0;
  margin-bottom: 15px;
  font-weight: bold;
}

/* 通用選擇框樣式 */
.filter-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  background-color: #fdfdfd;
  appearance: none; /* 移除默認箭頭 */
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13.2-5.4H18.6c-5%200-9.3%201.8-13.2%205.4A17.6%2017.6%200%200%200%200%2082.7c0%205%201.8%209.3%205.4%2013.2l128%20127.9c3.9%203.9%208.7%205.8%2013.5%205.8s9.6-1.9%2013.5-5.8L287%2095.9c3.9-3.9%205.9-8.2%205.9-13.2%200-5-1.9-9.3-5.9-13.2z%22%2F%3E%3C%2Fsvg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 12px;
}

.filter-select:focus {
  border-color: #a08d7a;
  outline: none;
  box-shadow: 0 0 0 2px rgba(160, 141, 122, 0.2);
}

/* 距離輸入框和滑桿 */
.distance-inputs {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.distance-input {
  width: 80px;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 15px;
  text-align: center;
}

.distance-input:focus {
  border-color: #a08d7a;
  outline: none;
  box-shadow: 0 0 0 2px rgba(160, 141, 122, 0.2);
}

.distance-range {
  width: 100%;
  -webkit-appearance: none;
  height: 8px;
  background: #f0f0f0;
  outline: none;
  border-radius: 5px;
  opacity: 0.7;
  transition: opacity 0.2s;
  margin-top: 5px;
}

.distance-range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #a08d7a;
  cursor: grab;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.distance-range::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #a08d7a;
  cursor: grab;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.range-labels {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #777;
  margin-top: 5px;
}

/* 時間選擇器 */
.time-inputs {
  display: flex;
  align-items: center;
  gap: 5px;
}

.time-select {
  width: 70px;
  padding: 8px 5px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 15px;
  text-align: center;
  background-color: #fdfdfd;
}

.time-select:focus {
  border-color: #a08d7a;
  outline: none;
  box-shadow: 0 0 0 2px rgba(160, 141, 122, 0.2);
}

/* 標籤按鈕 */
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tag-button {
  background-color: #eee;
  color: #555;
  border: 1px solid #ddd;
  padding: 8px 15px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 15px;
  transition:
    background-color 0.2s,
    color 0.2s,
    border-color 0.2s;
}

.tag-button:hover {
  background-color: #e0e0e0;
}

.tag-button.active {
  background-color: #a08d7a;
  color: #fff;
  border-color: #a08d7a;
}

.tag-button:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(160, 141, 122, 0.3);
}

/* 響應式調整 */
@media (max-width: 768px) {
  .filter-panel {
    width: 100vw; /* 小螢幕下佔滿整個寬度 */
    right: -100vw; /* 隱藏狀態 */
  }

  .filter-panel-open {
    right: 0;
  }

  .panel-content {
    padding: 15px;
  }

  .section-title {
    font-size: 16px;
  }

  .filter-select,
  .distance-input,
  .time-select,
  .tag-button {
    font-size: 14px;
    padding: 10px;
  }
}
</style>