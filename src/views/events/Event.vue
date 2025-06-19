<script setup>
import { onMounted, computed, nextTick } from 'vue'
import { useEventStore } from '@/stores/event'
import { useTagStore } from '@/stores/tag'
import { storeToRefs } from 'pinia'
import ModalCreate from '@/components/events/ModalCreate.vue'
import EventCard from '@/components/events/EventCard.vue'

const eventStore = useEventStore()
const { events } = storeToRefs(eventStore)
const tagStore = useTagStore()

onMounted(() => {
  eventStore.fetchEvents()
  tagStore.fetchTags()
})

const sortedEvents = computed(() => {
  return [...events.value]
    .filter(event => event && event.status !== 2) // 過濾刪除活動
    .sort((a, b) => new Date(b.startAt) - new Date(a.startAt))
})


async function handleEventUpdate() {
  try {
    await eventStore.fetchEvents()
    await nextTick()
  } catch (error) {
    console.error('更新事件列表失敗:', error)
  }
}

</script>

<template>
  <div class="page">
    <ModalCreate />
    <div class="event-list">
      <EventCard
        v-for="event in sortedEvents"
        :key="event.id"
        :event="event"
        @update="handleEventUpdate()"
      />
    </div>
  </div>
</template>

<style scoped>
.page {
  padding: 20px;
}
.event-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin: 10px 200px;
}
</style>