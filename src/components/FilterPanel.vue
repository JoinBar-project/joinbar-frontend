<template>
  <div class="filter-panel-container">
    <div class="filter-header">
      <h2 class="filter-title">篩選</h2>
      <button @click="closePanel" class="close-button">X</button>
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
      <label class="filter-label">營業時間 (小時)</label>
      <div class="range-inputs">
        <input
          type="number"
          v-model.number="filters.minOpenHour"
          @input="updateOpenHours"
          class="range-number-input"
          min="0"
          max="24"
        />
        <span>-</span>
        <input
          type="number"
          v-model.number="filters.maxOpenHour"
          @input="updateOpenHours"
          class="range-number-input"
          min="0"
          max="24"
        />
      </div>
      <input
        type="range"
        v-model.number="filters.minOpenHour"
        @input="updateOpenHoursRange"
        class="range-slider"
        min="0"
        max="24"
        step="1"
      />
      <input
        type="range"
        v-model.number="filters.maxOpenHour"
        @input="updateOpenHoursRange"
        class="range-slider"
        min="0"
        max="24"
        step="1"
      />
      <div class="range-labels">
        <span>00:00</span>
        <span>24:00</span>
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
import { ref, defineEmits, onMounted } from 'vue'

// 定義此元件可以向父元件發出的事件
const emit = defineEmits(['filter-changed', 'close-panel'])

// 篩選條件的響應式狀態，包含了所有篩選器當前選定的值
const filters = ref({
  address: 'any', // 地點篩選，預設為「任何地方」
  ratingSort: 'any', // 評價排序，預設為「任何」
  minDistance: 0, // 最小距離，預設 0 公尺
  maxDistance: 5000, // 最大距離，預設 5000 公尺
  minOpenHour: 0, // 最小營業時間 (小時，0-24)，預設 00:00
  maxOpenHour: 24, // 最大營業時間 (小時，0-24)，預設 24:00
  tags: [], // 已選擇的標籤陣列
})

// 定義可供選擇的熱門標籤
const popularTags = [
  '信義區',
  '大安區',
  '中山區',
  '精釀啤酒',
  '創意調酒',
  '運動酒吧',
  '秘密基地',
  '約會小酌',
  '現場表演', // 從 MapView 的原始資料中提取一些常見標籤
  '高空美景',
  '餐點美味',
  '多種啤酒',
  '輕鬆氛圍',
  '獨特調酒',
  '品味之選',
  '大型螢幕',
  '觀賽熱點',
  '復古',
  '主題',
  '小酌',
]

// --- 輔助函數 ---

/**
 * 格式化小時數為時間字符串 (例如 19 -> "19:00", 24 -> "00:00")
 * @param {number} hour 小時數 (0-24)
 * @returns {string} 格式化後的時間字符串
 */
// function formatHourToTime(hour) {
//  if (hour === 24) return '00:00' // 24點表示隔天的0點
//  return hour.toString().padStart(2, '0') + ':00'
// }

const updateDistance = () => {
  // 強制轉換為數字，處理可能為空字串的情況
  filters.value.minDistance = Number(filters.value.minDistance)
  filters.value.maxDistance = Number(filters.value.maxDistance)

  // 確保 minDistance 不大於 maxDistance
  if (filters.value.minDistance > filters.value.maxDistance) {
    filters.value.minDistance = filters.value.maxDistance
  }
  // 確保值在有效範圍內 [0, 5000]
  filters.value.minDistance = Math.max(0, Math.min(filters.value.minDistance, 5000))
  filters.value.maxDistance = Math.max(0, Math.min(filters.value.maxDistance, 5000))

  applyFilters()
}

/**
 * 更新距離範圍的滑桿，並觸發篩選
 * 當 maxDistance 滑桿改變時，確保 minDistance 不超過 maxDistance
 */
const updateDistanceRange = () => {
  // 確保 minDistance 不超過 maxDistance
  if (filters.value.minDistance > filters.value.maxDistance) {
    filters.value.minDistance = filters.value.maxDistance
  }
  applyFilters()
}

/**
 * 更新營業時間的數字輸入框，並觸發篩選
 * 確保時間範圍有效，並都在有效範圍內 [0, 24]
 */
const updateOpenHours = () => {
  // 強制轉換為數字
  filters.value.minOpenHour = Number(filters.value.minOpenHour)
  filters.value.maxOpenHour = Number(filters.value.maxOpenHour)

  // 確保值在有效範圍內 [0, 24]
  filters.value.minOpenHour = Math.max(0, Math.min(filters.value.minOpenHour, 24))
  filters.value.maxOpenHour = Math.max(0, Math.min(filters.value.maxOpenHour, 24))

  // 處理跨日邏輯：如果 minHour 大於 maxHour (例如 22:00 - 02:00)
  // 在這裡，我們假設輸入的是 0-24 的時間點，如果 min > max 代表是跨日選取
  // MapView 中的篩選邏輯會處理實際的跨日時間段比較
  // 在這裡只需確保 min <= max 是合理順序即可，否則交換
  if (filters.value.minOpenHour > filters.value.maxOpenHour && filters.value.maxOpenHour !== 0) {
    // 如果 min > max 但 max 不是 0 (代表跨日選取)，則不自動調整 minOpenHour，
    // 因為這可能是使用者意圖的跨日篩選。
    // 如果 max 是 0，則可能是使用者手誤，min 也應調整為 0
    if (filters.value.maxOpenHour === 0) {
      filters.value.minOpenHour = 0
    }
  } else if (filters.value.minOpenHour > filters.value.maxOpenHour) {
    // 如果 min > max 且 max 不為0，可能是手誤，交換兩者
    const temp = filters.value.minOpenHour
    filters.value.minOpenHour = filters.value.maxOpenHour
    filters.value.maxOpenHour = temp
  }

  applyFilters()
}

/**
 * 更新營業時間的滑桿，並觸發篩選
 * 確保時間範圍有效，如果 minOpenHour 超過 maxOpenHour，則自動調整
 *
 * 這裡由於有兩個滑桿，需要更精確的邏輯來處理相互關係。
 * 較好的做法是使用一個第三方雙向滑桿元件，但若堅持兩個滑桿，
 * 需要考慮使用者拖動時的意圖：
 * 1. 拖動 minOpenHour 時，如果超過 maxOpenHour，將 maxOpenHour 也推動到 minOpenHour。
 * 2. 拖動 maxOpenHour 時，如果低於 minOpenHour，將 minOpenHour 也拉到 maxOpenHour。
 */
const updateOpenHoursRange = () => {
  // 確保 minOpenHour 不超過 maxOpenHour，除非 maxOpenHour是0代表跨日
  if (filters.value.minOpenHour > filters.value.maxOpenHour && filters.value.maxOpenHour !== 0) {
    // 假設使用者意圖是選取跨日範圍，但拖動順序導致 min > max。
    // 在這裡，我們讓它保持，MapView 的篩選邏輯會處理這種情況。
    // 如果你希望強制 min <= max，則可以將 minOpenHour 設為 maxOpenHour
    // filters.value.minOpenHour = filters.value.maxOpenHour;
  } else if (filters.value.minOpenHour > filters.value.maxOpenHour) {
    // 如果 maxOpenHour 是 0，且 minOpenHour > maxOpenHour，則將 maxOpenHour 設為 minOpenHour
    filters.value.maxOpenHour = filters.value.minOpenHour
  }
  applyFilters()
}

/**
 * 切換標籤的選取狀態，並觸發篩選
 * @param {string} tag 被點擊的標籤名稱
 */
const toggleTag = (tag) => {
  const index = filters.value.tags.indexOf(tag)
  if (index > -1) {
    // 如果標籤已存在，則移除
    filters.value.tags.splice(index, 1)
  } else {
    // 如果標籤不存在，則添加
    filters.value.tags.push(tag)
  }
  applyFilters() // 標籤改變時立即應用篩選
}

/**
 * 發送 'filter-changed' 事件，將當前所有篩選條件傳遞給父元件
 */
const applyFilters = () => {
  // 複製一份 filters.value，避免直接修改原始物件
  emit('filter-changed', { ...filters.value })
}

/**
 * 重設所有篩選條件為預設值，並觸發篩選
 */
const resetFilters = () => {
  filters.value = {
    address: 'any',
    ratingSort: 'any',
    minDistance: 0,
    maxDistance: 5000,
    minOpenHour: 0,
    maxOpenHour: 24,
    tags: [],
  }
  applyFilters() // 重設後立即應用篩選
}

/**
 * 關閉篩選面板，發送 'close-panel' 事件給父元件
 */
const closePanel = () => {
  emit('close-panel')
}

// 在元件掛載後，立即觸發一次篩選，確保初始狀態正確顯示
// 這點非常重要，確保 MapView 初始就能根據預設篩選顯示酒吧
onMounted(() => {
  applyFilters()
})
</script>

<style scoped>
.filter-panel-container {
  padding: 1.5rem;
  background-color: #ffffff;
  height: 100%;
  overflow-y: auto; /* 內容超出時顯示滾動條 */
  box-shadow: -4px 0 10px rgba(0, 0, 0, 0.1);
  position: absolute;
  top: 0;
  right: 0;
  width: 320px; /* 篩選面板的寬度略微調整 */
  max-width: 90vw; /* 防止在極小螢幕上超出 */
  z-index: 100;
  display: flex;
  flex-direction: column; /* 使內容垂直排列 */
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
  font-size: 1.6rem; /* 稍微增大標題字體 */
  font-weight: 700;
  color: #333;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.8rem; /* 增大關閉按鈕，更好點擊 */
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
  font-size: 1.05rem; /* 稍微增大標籤字體 */
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
  padding: 0.6rem; /* 調整內邊距 */
  border: 1px solid #e0e0e0;
  border-radius: 0.5rem;
  font-size: 0.95rem;
  text-align: center;
  -moz-appearance: textfield; /* 隱藏 Firefox 數字輸入框的箭頭 */
}
/* 隱藏 Chrome/Safari/Edge 數字輸入框的箭頭 */
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
  margin-top: auto; /* 將操作按鈕推到底部 */
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

/* 響應式調整 */
@media (max-width: 600px) {
  .filter-panel-container {
    width: 100vw; /* 在小螢幕上佔滿寬度 */
    right: 0;
    left: 0;
    padding: 1rem;
  }
}
</style>
