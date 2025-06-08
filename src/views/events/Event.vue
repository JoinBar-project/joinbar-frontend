<script setup>
import { onMounted, computed } from 'vue'
import { useEventStore } from '@/stores/event'
import { storeToRefs } from 'pinia'
import ModalCreate from '@/components/events/ModalCreate.vue'
import EventCard from '@/components/events/EventCard.vue'

const eventStore = useEventStore()
const { events } = storeToRefs(eventStore)

onMounted(() => {
  eventStore.fetchEvents()
})

const sortedEvents = computed(() => {
  // 依照 startDate 新→舊排序
  return [...events.value].sort((a, b) => {
    return new Date(b.startDate) - new Date(a.startDate)
  })
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