<script setup>
import { onMounted, computed, nextTick, ref, watch } from 'vue'
import { useEventStore } from '@/stores/event'
import { useTagStore } from '@/stores/tag'
import { storeToRefs } from 'pinia'
import ModalCreate from '@/components/events/ModalCreate.vue'
import EventCard from '@/components/events/EventCard.vue'
import SparkleBg from '@/components/events/SparkleBg.vue'
import Beer from '@/assets/beers-bgImage.jpg'

const eventStore = useEventStore()
const { events } = storeToRefs(eventStore)
const tagStore = useTagStore()

const localEvents = ref([])
const displayCount = ref(15)

onMounted(() => {
  eventStore.fetchEvents()
  tagStore.fetchTags()
})

const sortedEvents = computed(() => {
  const eventsToShow = localEvents.value.length > 0 ? localEvents.value : events.value
  return [...eventsToShow]
    .filter(event => event && event.status !== 2)
    .sort((a, b) => new Date(b.startAt) - new Date(a.startAt))
})

const visibleEvents = computed(() => sortedEvents.value.slice(0, displayCount.value))

function loadMore() {
  displayCount.value += 15
}

watch(() => events.value, (newEvents) => {
  if (newEvents.length > 0) {
    localEvents.value = [...newEvents]
  }
}, { immediate: true })

function handleEventCreated(newEvent) {
  localEvents.value = [newEvent, ...localEvents.value]
  nextTick(() => {
    eventStore.fetchEvents()
  })
}

async function handleEventUpdate() {
  try {
    await eventStore.fetchEvents()
    localEvents.value = [...events.value]
    await nextTick()
  } catch (error) {
    console.error('更新事件列表失敗:', error)
  }
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <SparkleBg :backgroundImage="Beer" />

  <div class="page">
    <ModalCreate @eventCreated="handleEventCreated" />
    <div class="event-list">
      <EventCard
        v-for="event in visibleEvents"
        :key="event.id"
        :event="event"
        @update="handleEventUpdate"
      />
    </div>
    <div class="load-more-container">
      <button
        v-if="displayCount < sortedEvents.length"
        class="load-more-btn"
        @click="loadMore"
       >
        查看更多
      </button>
      <p v-else class="no-more-text" @click="scrollToTop">
        沒有喜歡的活動嗎？自己創一個吧！
      </p>
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
.load-more-container {
  text-align: center;
  margin-top: 20px;
}
.load-more-btn {
  padding: 10px 20px;
  font-size: 16px;
  background-color: #333;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}
.load-more-btn:hover {
  background-color: #555;
}

.no-more-text {
  font-size: 16px;
  color: #c9c9c9;
  margin-top: 10px;
  cursor: pointer;
}
.no-more-text:hover {
  color: #ffffff;
}
</style>