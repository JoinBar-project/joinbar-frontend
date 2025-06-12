<script setup>
import dayjs from 'dayjs'
import 'dayjs/locale/zh-tw'
import weekday from 'dayjs/plugin/weekday'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import updateLocale from 'dayjs/plugin/updateLocale'
import ModalEdit from '@/components/events/ModalEdit.vue'
import { useTagStore } from '@/stores/tag'

dayjs.extend(localizedFormat)
dayjs.extend(weekday)
dayjs.extend(updateLocale)
dayjs.locale('zh-tw')

const props = defineProps({
  event: {
    type: Object,
    required: true,
    validator(value) {
      return value && (value.id !== undefined && value.id !== null)
    }
  },
})
const emit = defineEmits(['update'])

const tagStore = useTagStore()

function getTagName(id) {
  return tagStore.tagsMap[id] || '未知標籤'
}

function formatEventDate(dateStr) {
  if (!dateStr) return ''
  const weekMap = ['日', '一', '二', '三', '四', '五', '六']
  const d = dayjs(dateStr)
  return `${d.format('YYYY.MM.DD')}(${weekMap[d.day()]}) ${d.format('HH:mm')}`
}

function sliceChinese(str, n) {
  if (!str) return ''
  const matches = str.match(/[\u4e00-\u9fa5]/g)
  if (!matches) return ''
  return matches.slice(0, n).join('')
}
</script>

<template>
  <div class="event-card">
    <img :src="props.event.imageUrl" alt="活動圖片" class="event-img"/>
    <div class="event-info">
      <p class="time">{{ formatEventDate(props.event.startDate) }} ~ {{ formatEventDate(props.event.endDate) }}</p>
      <h3 class="title">{{ props.event.name }}</h3>
      <p>
        <span class="location">📍{{ sliceChinese(props.event.location, 6) }}</span>｜<span class="bar-name">{{ props.event.barName }}</span>
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
  border-color: #8B7355;
  color: #8B7355;
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
