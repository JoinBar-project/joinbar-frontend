<script setup>
import { computed } from "vue"; // 導入 computed
import dayjs from "dayjs";
import "dayjs/locale/zh-tw";
import weekday from "dayjs/plugin/weekday";
import localizedFormat from "dayjs/plugin/localizedFormat";
import updateLocale from "dayjs/plugin/updateLocale";
import ModalEdit from "@/components/events/ModalEdit.vue";
import { useTagStore } from "@/stores/tag";

dayjs.extend(localizedFormat);
dayjs.extend(weekday);
dayjs.extend(updateLocale);
dayjs.locale("zh-tw");

const props = defineProps({
  event: {
    type: Object,
    required: true,
    validator(value) {
      // 確保 event 至少有 id，並且現在我們希望它有 latitude 和 longitude
      return (
        value &&
        value.id !== undefined &&
        value.id !== null &&
        typeof value.latitude === "number" &&
        typeof value.longitude === "number"
      );
    },
  },
});
const emit = defineEmits(["update"]);

const tagStore = useTagStore();

// Google Static Maps API Key - 請替換為你的實際 Key！
// 注意：Static Maps API Key 也要在 Google Cloud Console 中啟用並限制！
const GOOGLE_STATIC_MAPS_API_KEY = "YOUR_GOOGLE_STATIC_MAPS_API_KEY";

function getTagName(id) {
  return tagStore.tagsMap[id] || "未知標籤";
}

function formatEventDate(dateStr) {
  if (!dateStr) return "";
  const weekMap = ["日", "一", "二", "三", "四", "五", "六"];
  const d = dayjs(dateStr);
  return `${d.format("YYYY.MM.DD")}(${weekMap[d.day()]}) ${d.format("HH:mm")}`;
}

function sliceChinese(str, n) {
  if (!str) return "";
  // 這裡維持原來的邏輯，只針對中文字符截斷
  const matches = str.match(/[\u4e00-\u9fa5]/g);
  if (!matches) return "";
  return matches.slice(0, n).join("");
}

// ============== 新增的計算屬性來生成地圖圖片 URL ==============
const mapImageUrl = computed(() => {
  const { latitude, longitude } = props.event;

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return null; // 如果沒有經緯度，則不顯示地圖
  }

  // 設置地圖尺寸 (width x height) 和縮放比例
  const size = "300x200";
  const zoom = 15; // 縮放級別
  const mapType = "roadmap"; // 地圖類型 (roadmap, satellite, hybrid, terrain)
  const markerColor = "red"; // 標記顏色
  const markerLabel = "P"; // 標記上的文字 (可選)

  // 構造 Google Static Maps API URL
  return `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=${zoom}&size=${size}&maptype=${mapType}&markers=color:${markerColor}%7Clabel:${markerLabel}%7C${latitude},${longitude}&key=${GOOGLE_STATIC_MAPS_API_KEY}`;
});
</script>

<template>
  <div class="event-card">
    <img :src="props.event.imageUrl" alt="活動圖片" class="event-img" />

    <img
      v-if="mapImageUrl"
      :src="mapImageUrl"
      alt="活動地點地圖"
      class="event-map-img"
    />

    <div class="event-info">
      <p class="time">
        {{ formatEventDate(props.event.startDate) }} ~
        {{ formatEventDate(props.event.endDate) }}
      </p>
      <h3 class="title">{{ props.event.name }}</h3>
      <p>
        <span class="location"
          >📍{{ sliceChinese(props.event.location, 6) }}</span
        >｜<span class="bar-name">{{ props.event.barName }}</span>
      </p>
      <div class="bottom-row">
        <div class="tags">
          <span class="tag" v-for="tagId in props.event.tagIds" :key="tagId">
            #{{ getTagName(tagId) }}
          </span>
        </div>
        <ModalEdit
          v-if="props.event.id"
          :event-id="props.event.id"
          @update="emit('update')"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference "tailwindcss";

.event-card {
  @apply bg-gray-100 rounded-2xl m-2;
}

.event-img {
  @apply w-full h-44 object-cover rounded-t-2xl bg-gray-300;
}

.event-map-img {
  @apply w-full h-auto object-cover rounded-b-2xl; /* 調整高度和圓角 */
  margin-top: -1px; /* 為了連接在 event-img 下方 */
  border-top-left-radius: 0;
  border-top-right-radius: 0;
}

.event-info {
  @apply p-2;
}

.time {
  @apply text-sm;
}

.title {
  @apply py-2 text-2xl font-bold;
}

.tags {
  @apply flex flex-nowrap gap-1 my-2;
}

.tag {
  @apply inline-block border-2 px-2 py-1 rounded-2xl text-xs font-medium;
  border-color: #8b7355;
  color: #8b7355;
}

.location {
  @apply text-black text-sm bg-gray-300 px-2 py-2 rounded-2xl;
}

.bar-name {
  @apply font-bold;
}

.bottom-row {
  @apply flex items-center justify-between gap-2 mt-2;
}
</style>
