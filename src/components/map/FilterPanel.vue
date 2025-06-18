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
        >
          <img
            src="@/assets/icons/mapicons/close-tag.svg"
            alt="移除篩選"
            class="remove-filter-icon"
          />
        </button>
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
      <label class="filter-label">營業時間</label>
      <div class="time-picker-vertical">
        <div class="time-picker-row-single">
          <label class="time-label"></label>
          <input
            type="time"
            lang="en-GB"
            v-model="openTime"
            @change="updateOpenHours"
            class="time-picker-input"
            step="900"
            min="00:00"
            max="23:59"
          />
        </div>
        <div class="time-picker-row-single">
          <label class="time-label"></label>
          <input
            type="time"
            lang="en-GB"
            v-model="closeTime"
            @change="updateOpenHours"
            class="time-picker-input"
            step="900"
            min="00:00"
            max="23:59"
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

<script setup>
import { ref, defineEmits, watch, defineProps, computed } from "vue";

const emit = defineEmits(["filter-changed", "close-panel"]);

const props = defineProps({
  initialFilters: {
    type: Object,
    default: () => ({
      address: [],
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

const filters = ref({ ...props.initialFilters });
const popularTags = [
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
const districtTags = [
  "信義區",
  "大安區",
  "中山區",
  "松山區",
  "萬華區",
  "士林區",
];
const openTime = ref("00:00");
const closeTime = ref("23:59");

// 格式化已套用篩選條件以供顯示
const appliedFiltersForDisplay = computed(() => {
  const displayFilters = [];

  if (
    Array.isArray(filters.value.address) &&
    filters.value.address.length > 0
  ) {
    filters.value.address.forEach((addr) => {
      displayFilters.push({
        label: `地點: ${addr}`,
        type: "address",
        value: addr,
      });
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

  if (filters.value.minDistance !== 0 || filters.value.maxDistance !== 5000) {
    const min = filters.value.minDistance;
    const max = filters.value.maxDistance;
    displayFilters.push({
      label: `距離: ${min} - ${max} 公尺`,
      type: "distance",
      value: { min, max },
    });
  }

  const currentMinHour = filters.value.minOpenHour;
  const currentMinMinute = filters.value.minOpenMinute;
  let currentMaxHour = filters.value.maxOpenHour;
  let currentMaxMinute = filters.value.maxOpenMinute;

  if (currentMaxHour === 24 && currentMaxMinute === 0) {
    currentMaxHour = 0;
  }

  if (
    currentMinHour !== 0 ||
    currentMinMinute !== 0 ||
    currentMaxHour !== 0 ||
    currentMaxMinute !== 0
  ) {
    const formatTime = (h, m) => {
      const hour = String(h).padStart(2, "0");
      const minute = String(m).padStart(2, "0");
      return `${hour}:${minute}`;
    };
    const minTime = formatTime(currentMinHour, currentMinMinute);
    const maxTime = formatTime(currentMaxHour, currentMaxMinute);

    displayFilters.push({
      label: `營業時間: ${minTime} - ${maxTime}`,
      type: "openHour",
      value: {
        minHour: filters.value.minOpenHour,
        minMinute: filters.value.minOpenMinute,
        maxHour: filters.value.maxOpenHour,
        maxMinute: filters.value.maxOpenMinute,
      },
    });
  }

  if (Array.isArray(filters.value.tags)) {
    filters.value.tags.forEach((tag) => {
      displayFilters.push({
        label: `標籤: ${tag}`,
        type: "tags",
        value: tag,
      });
    });
  }

  return displayFilters;
});

// 移除已套用的單一篩選條件
const removeAppliedFilter = (type, value) => {
  switch (type) {
    case "address":
      if (Array.isArray(filters.value.address)) {
        filters.value.address = filters.value.address.filter(
          (addr) => addr !== value
        );
      } else {
        filters.value.address = [];
      }
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
      openTime.value = "00:00";
      closeTime.value = "23:59";
      break;
    case "tags":
      filters.value.tags = filters.value.tags.filter((t) => t !== value);
      break;
  }
  applyFilters();
};

// 更新距離數值輸入框並同步篩選
const updateDistance = () => {
  if (filters.value.minDistance > filters.value.maxDistance) {
    filters.value.minDistance = filters.value.maxDistance;
  }
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

const updateDistanceRange = () => {
  if (filters.value.minDistance > filters.value.maxDistance) {
    filters.value.minDistance = filters.value.maxDistance;
  }
  applyFilters();
};

const updateOpenHours = () => {
  const [minOpenHour, minOpenMinute] = openTime.value.split(":").map(Number);
  let [maxOpenHour, maxOpenMinute] = closeTime.value.split(":").map(Number);

  if (maxOpenHour === 0 && maxOpenMinute === 0 && closeTime.value === "00:00") {
    if (openTime.value !== "00:00") {
      maxOpenHour = 24;
      maxOpenMinute = 0;
    }
  }

  filters.value.minOpenHour = minOpenHour;
  filters.value.minOpenMinute = minOpenMinute;
  filters.value.maxOpenHour = maxOpenHour;
  filters.value.maxOpenMinute = maxOpenMinute;

  const startMinutes = minOpenHour * 60 + minOpenMinute;
  const endMinutes = maxOpenHour * 60 + maxOpenMinute;

  if (startMinutes > endMinutes && endMinutes !== 0) {
    filters.value.maxOpenHour = minOpenHour;
    filters.value.maxOpenMinute = minOpenMinute;
    closeTime.value = openTime.value;
  }

  applyFilters();
};

const toggleTag = (tag) => {
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

const applyFilters = () => {
  emit("filter-changed", { ...filters.value });
};

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
  openTime.value = "00:00";
  closeTime.value = "23:59";
  applyFilters();
};

const closePanel = () => {
  emit("close-panel");
};

// 更新本地篩選狀態
watch(
  () => props.initialFilters,
  (newFilters) => {
    if (newFilters.tags && Array.isArray(newFilters.tags)) {
      filters.value = { ...newFilters };
    } else {
      filters.value = { ...newFilters, tags: [] };
    }

    let displayMaxHour = newFilters.maxOpenHour;
    if (displayMaxHour === 24 && newFilters.maxOpenMinute === 0) {
      displayMaxHour = 0;
    }

    openTime.value = `${String(newFilters.minOpenHour).padStart(2, "0")}:${String(newFilters.minOpenMinute).padStart(2, "0")}`;
    closeTime.value = `${String(displayMaxHour).padStart(2, "0")}:${String(newFilters.maxOpenMinute).padStart(2, "0")}`;
  },
  { deep: true, immediate: true }
);
</script>

<style scoped>
.applied-filters-list-wrapper {
  margin-bottom: 24px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 5px;
  max-width: 100%;
  word-break: break-all;
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
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.remove-filter-button {
  background: none;
  border: none;
  margin-left: 8px;
  cursor: pointer;
  opacity: 0.8;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.05);
}

.remove-filter-button:hover {
  opacity: 1;
  background-color: rgba(0, 0, 0, 0.1);
}

.remove-filter-icon {
  width: 12px;
  height: 12px;
  color: #333;
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

.time-picker-vertical {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}
.time-picker-row-single {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.time-label {
  font-size: 14px;
  color: #555;
  margin-bottom: 2px;
}
.time-picker-input {
  min-width: 150px;
  width: 150px;
  height: 40px;
  padding: 6px 16px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  font-size: 16px;
  box-sizing: border-box;
  background: #fff;
  text-align: left;
}

.tags-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, 120px);
  gap: 12px;
}

.tag-button,
.tag-button-active {
  width: 100%;
  min-width: 0;
  justify-content: center;
  text-align: center;
  padding: 10px 0;
  border-radius: 14px;
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
  padding: 12px 24px;
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
