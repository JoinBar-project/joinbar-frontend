<script setup>
import { onMounted, computed } from 'vue'
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
    .filter(event => event.status !== 2) // 過濾刪除活動
    .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
})

</script>

<template>
  <div class="page">
    <h1>酒吧活動</h1>
    <p>探索附近的酒吧活動。</p>
    <ModalCreate />
    <div class="event-list">
      <EventCard
        v-for="event in sortedEvents"
        :key="event.id"
        :event="event"
        @update="eventStore.fetchEvents()"
      />
    </div>
  </div>
</template>

<style scoped>
.event-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin: 10px 200px;
}
</style>