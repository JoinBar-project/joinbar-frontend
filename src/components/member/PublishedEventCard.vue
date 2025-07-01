<script setup>
import { useEvent } from '@/composables/useEvent.js';
import { toRef } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const props = defineProps({
  event: Object
});

const eventRef = toRef(props, 'event');
const { joinedNum, formattedEventTime } = useEvent(eventRef);
</script>

<template>
  <li
    @click="router.push({ name: 'EventInformation', params: { id: props.event.id } })"
    class="grid grid-cols-1 md:grid-cols-[8rem_1fr] gap-4 p-6 bg-white rounded-xl border border-gray-100 shadow-sm hover:-translate-y-1 hover:scale-[1.005] hover:shadow-lg transition-all duration-300 ease-in-out cursor-pointer">
    <div class="w-full overflow-hidden rounded aspect-square md:w-32">
      <img :src="event.imageUrl|| '/default-event.jpg'" alt="event-image" class="object-cover w-full h-full" />
    </div>
    <div class="flex flex-col justify-between h-full">
      <div class="flex items-start justify-between">
        <h3 class="text-lg font-bold">{{ event.name }}</h3>
        <span class="px-3 py-1 text-sm rounded-full" :class="event.statusText === '即將到來' 
        ? 'bg-green-200 text-green-800' 
        : 'bg-gray-300 text-gray-600'">
          {{ event.statusText }}
        </span>
      </div>

      <div class="grid grid-cols-[1.5rem_1fr] gap-1 text-sm text-gray-600 pt-2">
        <div><i class="w-5 text-center fa-solid fa-table"></i></div>
        <div>活動時間：{{ formattedEventTime }}</div>
        <div><i class="w-5 text-center fa-solid fa-wine-glass"></i></div>
        <div>店名：{{ event.barName }}</div>
        <div><i class="w-5 text-center fa-solid fa-location-dot"></i></div>
        <div>地址：{{ event.location }}</div>
        <!-- <div><i class="w-5 text-center fa-solid fa-user"></i></div>
        <div>目前報名人數：{{ joinedNum }} <span class="font-bold">/</span> 報名人數上限：{{ event.maxPeople }}</div> -->
      </div>
    </div>
  </li>
</template>
