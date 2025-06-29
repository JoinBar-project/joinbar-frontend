<script setup>
import { ref, computed } from 'vue';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/vue';
import { ChevronUpDownIcon } from '@heroicons/vue/20/solid';

const joinedEvents = ref([
  {
    id: 1,
    title: '深夜爵士酒吧之夜',
    date: '2025-08-15',
    location: 'Jazz Corner',
    status: '即將到來',
    currentNum: 18,
    maxNum: 30,
    imageUrl: new URL('@/assets/events/1_pexels-18393328-6469749.jpg', import.meta.url).href
  },
  {
    id: 2,
    title: '手工雞尾酒調製課程',
    date: '2025-08-12',
    location: 'Mixology Lab',
    status: '即將到來',
    currentNum: 12,
    maxNum: 15,
    imageUrl: new URL('@/assets/events/2_pexels-i-rem-dur-1175044181-32651589.jpg', import.meta.url).href
  },
  {
    id: 3,
    title: '復古搖滾音樂夜',
    date: '2025-08-18',
    location: 'Rock House',
    status: '即將到來',
    currentNum: 25,
    maxNum: 40,
    imageUrl: new URL('@/assets/events/3_pexels-bohlemedia-1089932.jpg', import.meta.url).href
  },
  {
    id: 4,
    title: '單身派對狂歡夜',
    date: '2025-08-22',
    location: 'Party Central',
    status: '即將到來',
    currentNum: 35,
    maxNum: 50,
    imageUrl: new URL('@/assets/events/4_pexels-lazarus-ziridis-351891426-32641339.jpg', import.meta.url).href
  },
  {
    id: 5,
    title: '紅酒品酒會',
    date: '2025-05-15',
    location: 'Vintage Cellar',
    status: '已結束',
    currentNum: 20,
    maxNum: 20,
    imageUrl: new URL('@/assets/events/5_pexels-cottonbro-4255484.jpg', import.meta.url).href
  },
  {
    id: 6,
    title: '90年代懷舊主題夜',
    date: '2025-05-08',
    location: 'Retro Zone',
    status: '已結束',
    currentNum: 28,
    maxNum: 30,
    imageUrl: new URL('@/assets/events/6_pexels-elina-sazonova-1850595.jpg', import.meta.url).href
  },
  {
    id: 7,
    title: '情人節浪漫雙人夜',
    date: '2025-02-14',
    location: 'Romance Bar',
    status: '已結束',
    currentNum: 16,
    maxNum: 20,
    imageUrl: new URL('@/assets/events/3_pexels-bohlemedia-1089932.jpg', import.meta.url).href
  },
  {
    id: 8,
    title: '新年倒數狂歡派對',
    date: '2024-12-31',
    location: 'Countdown Club',
    status: '已結束',
    currentNum: 100,
    maxNum: 100,
    imageUrl: new URL('@/assets/events/1_pexels-18393328-6469749.jpg', import.meta.url).href
  }
]);

const statusFilter = ref('全部');
const sortOrder = ref('desc');

const filteredEvents = computed(() => {
  let result = joinedEvents.value;

  if (statusFilter.value !== '全部') {
    result = result.filter(event => event.status === statusFilter.value);
  }

  result = result.slice().sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return sortOrder.value === 'desc' ? dateB - dateA : dateA - dateB;
  });

  return result;
});
</script>

<template>
  <section class="w-full max-w-4xl mx-auto">
    <h2 class="mb-4 text-2xl font-semibold text-[var(--color-primary-orange)]">我參加的活動</h2>
    <div class="flex flex-col flex-wrap items-start gap-4 mb-6 text-sm md:flex-row md:items-center">
      <div class="flex flex-col flex-wrap items-center w-full gap-2 text-sm md:flex-row md:w-fit">
        <span class="text-[var(--color-secondary-green)] font-bold">活動狀態：</span>
        <Listbox v-model="statusFilter">
          <div class="relative">
            <ListboxButton
              class="relative w-32 cursor-default rounded border border-gray-200 bg-white py-1.5 pl-3 pr-10 text-left shadow-sm focus:outline-none">
              <span class="block truncate">{{ statusFilter }}</span>
              <span class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <ChevronUpDownIcon class="w-4 h-4 text-gray-400" />
              </span>
            </ListboxButton>

            <ListboxOptions
              class="absolute z-10 w-full py-1 mt-1 overflow-auto text-sm bg-white rounded-md shadow-lg max-h-60 ring-1 ring-black/10 focus:outline-none">
              <ListboxOption v-for="option in ['全部', '即將到來', '已結束']" :key="option" :value="option" as="template" v-slot="{ selected, active }">
                <li
                  class="relative py-2 pl-10 pr-4 cursor-default select-none"
                  :class="{
                    'bg-[var(--color-primary-orange)] text-white': active,
                    'text-gray-900': !active
                  }">
                  <span :class="{ 'font-semibold': selected, 'font-normal': !selected }">
                    {{ option }}
                  </span>
                  <span v-if="selected" class="absolute inset-y-0 left-0 flex items-center pl-3 text-white">
                     <i class="w-4 h-4 fa-solid fa-check"></i>
                  </span>
                </li>
              </ListboxOption>
            </ListboxOptions>
          </div>
        </Listbox>
      </div>

      <div class="flex flex-col flex-wrap items-center w-full gap-2 text-sm md:flex-row md:w-fit">
        <span class="text-[var(--color-secondary-green)] font-bold">時間排序：</span>
        <Listbox v-model="sortOrder">
          <div class="relative">
            <ListboxButton
              class="relative w-32 cursor-default rounded border border-gray-200 bg-white py-1.5 pl-3 pr-10 text-left shadow-sm focus:outline-none">
              <span class="block truncate">
                {{ sortOrder === 'desc' ? '新 → 舊' : '舊 → 新' }}
              </span>
              <span class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <ChevronUpDownIcon class="w-4 h-4 text-gray-400" />
              </span>
            </ListboxButton>

            <ListboxOptions
              class="absolute z-10 w-full py-1 mt-1 overflow-auto text-sm bg-white rounded-md shadow-lg max-h-60 ring-1 ring-black/10 focus:outline-none">
              <ListboxOption
                v-for="option in [
                  { value: 'desc', label: '新 → 舊' },
                  { value: 'asc', label: '舊 → 新' }
                ]"
                :key="option.value"
                :value="option.value"
                as="template"
                v-slot="{ selected, active }">
                <li
                  class="relative py-2 pl-10 pr-4 cursor-default select-none"
                  :class="{
                    'bg-[var(--color-primary-orange)] text-white': active,
                    'text-gray-900': !active
                  }">
                  <span :class="{ 'font-semibold': selected, 'font-normal': !selected }">
                    {{ option.label }}
                  </span>
                  <span v-if="selected" class="absolute inset-y-0 left-0 flex items-center pl-3 text-white">
                    <i class="w-4 h-4 fa-solid fa-check"></i>
                  </span>
                </li>
              </ListboxOption>
            </ListboxOptions>
          </div>
        </Listbox>
      </div>
    </div>

    <div v-if="joinedEvents.length === 0" class="text-gray-500">尚未參加任何活動。</div>

    <ul v-else class="w-full space-y-6">
      <li
        v-for="event in filteredEvents"
        :key="event.id"
        class="grid grid-cols-1 md:grid-cols-[8rem_1fr] gap-4 p-6 bg-white rounded-xl border border-gray-100 shadow-sm hover:-translate-y-1 hover:scale-[1.005] hover:shadow-lg transition-all duration-300 ease-in-out cursor-pointer">
        <div class="w-full overflow-hidden rounded aspect-square md:w-32">
          <img :src="event.imageUrl" alt="event-image" class="object-cover w-full h-full" />
        </div>
        <div class="flex flex-col justify-between h-full">
          <div class="flex items-start justify-between">
            <h3 class="text-lg font-bold">{{ event.title }}</h3>
            <span
              class="px-3 py-1 text-sm rounded-full"
              :class="event.status === '即將到來' ? 'bg-blue-200 text-blue-800' : 'bg-gray-300 text-gray-600'">
              {{ event.status }}
            </span>
          </div>

          <div class="grid grid-cols-[1.5rem_1fr] gap-1 text-sm text-gray-600 pt-2">
            <div><i class="w-5 text-center fa-solid fa-table"></i></div>
            <div>活動日期：{{ event.date }}</div>

            <div><i class="w-5 text-center fa-solid fa-wine-glass"></i></div>
            <div>地點：{{ event.location }}</div>

            <div><i class="w-5 text-center fa-solid fa-user"></i></div>
            <div>報名人數：{{ event.currentNum }} / {{ event.maxNum }}</div>
          </div>
        </div>
      </li>
    </ul>
  </section>
</template>