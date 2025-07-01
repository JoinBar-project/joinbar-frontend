<script setup>
import { ref, computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/stores/authStore';
import apiClient from '@/api/axios';
import PublishedEventCard from '@/components/member/PublishedEventCard.vue';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/vue';
import { ChevronUpDownIcon } from '@heroicons/vue/20/solid';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/zh-tw';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('zh-tw');

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);

const publishedEvents = ref([]);
const isLoading = ref(true);

onMounted(async () => {
  try {
    const res = await apiClient.get('/event/all', {
      params: { hostUser: user.value.id }
    });
    console.log(res.data);
    publishedEvents.value = res.data;
  } catch (err) {
    console.error('我發佈的活動載入失敗', err);
  } finally {
    isLoading.value = false;
  }
});

const statusFilter = ref('全部');
const sortOrder = ref('desc');

const filteredEvents = computed(() => {
  let result = publishedEvents.value;

  result = result.map(event => {
    const now = dayjs();
    const endTime = dayjs(event.endAt);

    const statusText = endTime.isBefore(now) ? '已結束' : '即將到來';

    return {
      ...event,
      statusText
    };
  });

  if (statusFilter.value !== '全部') {
    result = result.filter(event => event.statusText === statusFilter.value);
  }

  result = result.slice().sort((a, b) => {
    const dateA = new Date(a.startAt);
    const dateB = new Date(b.startAt);
    return sortOrder.value === 'desc' ? dateB - dateA : dateA - dateB;
  });

  return result;
});
</script>

<template>
  <section class="w-full max-w-4xl mx-auto">
    <h2 class="mb-4 text-2xl font-semibold text-[var(--color-primary-orange)]">我發布的活動</h2>
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
              <ListboxOption
                v-for="option in ['全部', '即將到來', '已結束']"
                :key="option"
                :value="option"
                as="template"
                v-slot="{ selected, active }">
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
    <div v-if="isLoading">載入中...</div>
    <div v-else-if="publishedEvents.length === 0" class="text-gray-500">尚未發布任何活動。</div>
    <ul v-else class="w-full space-y-6">
      <PublishedEventCard v-for="event in filteredEvents" :key="event.id" :event="event" />
    </ul>
  </section>
</template>
