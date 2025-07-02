<script setup>
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import 'dayjs/locale/zh-tw'
import weekday from 'dayjs/plugin/weekday'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import updateLocale from 'dayjs/plugin/updateLocale'
import { useTagStore } from '@/stores/tag'
import { useRouter } from 'vue-router'

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

console.log('🕒 props.event.startAt:', props.event.startAt)
console.log('📘 typeof:', typeof props.event.startAt)
console.log('🔍 包含 T 和 Z?', props.event.startAt?.includes?.('T'), props.event.startAt?.includes?.('Z'))

const emit = defineEmits(['update'])

const tagStore = useTagStore()
const router = useRouter()

function getTagName(id) {
  return tagStore.tagsMap[id] || '未知標籤'
}

function formatEventDate(dateStr) {
  if (!dateStr) return ''
  const weekMap = ['日', '一', '二', '三', '四', '五', '六']
  const d = dayjs(dateStr).tz('Asia/Taipei')
  return `${d.format('LL')}(${weekMap[d.day()]}) ${d.format('HH:mm')}`
}

function sliceChinese(str, n) {
  if (!str) return ''
  const matches = str.match(/[\u4e00-\u9fa5]/g)
  if (!matches) return ''
  return matches.slice(0, n).join('')
}

function goToInfo() {
  router.push(`/event/${props.event.id}`)
}
</script>

<template>
  <div class="event-card" @click="goToInfo">
    
    <div>
      <img :src="props.event.imageUrl" alt="活動圖片" class="event-img" />
      <div class="event-info">
        <p class="time text-gray-400 leading-normal">
          {{ formatEventDate(props.event.startAt) }} ~ {{ formatEventDate(props.event.endAt) }}
        </p>
        <h3 class="title h-[5.5rem]">{{ props.event.name }}</h3>
        <p class="md:leading-normal leading-2">
          <span class="location">📍{{ sliceChinese(props.event.location, 6) }}</span>｜<span class="bar-name leading-[2.5]">{{ props.event.barName }}</span>
        </p>
      </div>
    </div>
 
    <div class="bottom-row p-4">
      <div class="tags">
        <span class="tag" v-for="tagId in props.event.tagIds" :key="tagId">
          #{{ getTagName(tagId) }}
        </span>
      </div>
      <div v-if="props.event.price === null" class="btn-open-form bg-[var(--color-secondary-green)] text-white hover:bg-[var(--color-primary-orange)]
      active:bg-[var(--color-primary-orange)] text-xs md:text-xl">
        查看詳情
      </div>
      <div v-else class="btn-open-form bg-[var(--color-primary-red)] text-white hover:bg-[var(--color-primary-orange)] active:bg-[var(--color-primary-orange)] text-xs md:text-xl">
        查看付費活動
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference "tailwindcss";

.event-card {
  @apply flex flex-col justify-between bg-gray-100 rounded-2xl m-2 transition duration-300 transform hover:-translate-y-1 hover:shadow-xl cursor-pointer;
}

.event-img {
  @apply w-full h-44 object-cover rounded-t-2xl bg-gray-300;
}

.event-info {
  @apply p-4;
}

.time {
  @apply text-sm;
}

.title {
  @apply py-2 text-2xl font-bold;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tags {
  @apply flex flex-nowrap gap-1 my-2;
}

.tag {
  @apply inline-block border-2 px-2 py-1 rounded-2xl font-medium text-[10px] md:text-lg;
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
  @apply flex items-center justify-between flex-wrap gap-2 mt-2;
  margin-top: auto;
}

.btn-open-form {
  @apply flex justify-center w-24 md:w-40 py-2 text-white rounded-2xl transition duration-200;
}

</style>
