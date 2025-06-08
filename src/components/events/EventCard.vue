<script setup>
import dayjs from 'dayjs'
import 'dayjs/locale/zh-tw'
import weekday from 'dayjs/plugin/weekday'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import updateLocale from 'dayjs/plugin/updateLocale'
import ModalEdit from '@/components/events/ModalEdit.vue'
dayjs.extend(localizedFormat)
dayjs.extend(weekday)
dayjs.extend(updateLocale)
dayjs.locale('zh-tw')

defineProps({
  event: Object,
})

// 輔助函數，根據日期字串輸出想要的格式
function formatEventDate(dateStr) {
  if (!dateStr) return ''
  // 自訂格式: 2025.01.01(一) 21:00
  const weekMap = ['日', '一', '二', '三', '四', '五', '六']
  const d = dayjs(dateStr)
  return `${d.format('YYYY.MM.DD')}(${weekMap[d.day()]}) ${d.format('HH:mm')}`
}

//地址中文切割
function sliceChinese(str, n) {
  if (!str) return ''
  // 正則擷取所有中文字
  const matches = str.match(/[\u4e00-\u9fa5]/g)
  if (!matches) return ''
  return matches.slice(0, n).join('')
}
</script>

<template>
  <div class="event-card">
    <img :src="event.imageUrl" alt="活動圖片" class="event-img"/>
    <div class="event-info">
      <p class="time">{{ formatEventDate(event.startDate) }} ~ {{ formatEventDate(event.endDate) }}</p>
      <h3 class="title">{{ event.name }}</h3>
      <div v-if="event.tags && event.tags.length" class="tags">
        <span v-for="tag in event.tags" :key="tag.id" class="tag">{{ tag.name }}</span>
      </div>
      <p><span class="location">📍{{ sliceChinese(event.location, 6) }}</span>｜<span class="bar-name">{{ event.barName }}</span>
      </p>
      <ModalEdit :event-id="event.id" @update="$emit('update')"/>
    </div>
  </div>
</template>

<style scoped>
.event-card {
  background: #f3f3f3;
  border-radius: 15px;
  margin: 0.5rem;
}
.event-img {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 10px 10px 0 0 ;
  background-color: rgb(211, 211, 211);
}
.event-info {
  padding: 10px;
}
.time {
  font-size: 14px;
}
.title {
  padding: 10px 0;
  font-size: 24px;
  font-weight: 700;
}
.location {
  color: rgb(0, 0, 0);
  font-size: 14px;
  background-color: rgb(212, 212, 212);
  padding: 8px 10px;
  border-radius: 15px ;
}
.bar-name{
  font-weight: 700;
}

</style>
