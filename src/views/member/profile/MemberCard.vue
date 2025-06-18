<script setup>
import { ref, onMounted, computed } from 'vue'
import { getBenefit } from '@/api/memberCard'
import BenefitCard from '@/components/member/BenefitCard.vue'
import dayjs from 'dayjs'

const benefitList = ref([])

onMounted(async () => {
  try {
    benefitList.value = await getBenefit()
  } catch (err) {
    console.error('取得優惠券失敗', err)
  }
})

const now = dayjs()

const availableBenefits = computed(() =>
  benefitList.value
    .filter(b => b.status === 1 && dayjs(b.endAt).isAfter(now))
    .sort((a, b) => dayjs(a.endAt).isAfter(b.endAt) ? 1 : -1)
)

const usedOrExpiredBenefits = computed(() =>
  benefitList.value
    .filter(b => b.status === 2 || (b.status === 1 && dayjs(b.endAt).isBefore(now)))
    .sort((a, b) => dayjs(a.endAt).isAfter(b.endAt) ? 1 : -1)
)
</script>

<template>
  <div class="p-4">
    <div v-if="availableBenefits.length === 0" class="text-center text-gray-500 py-16 text-lg">
      目前你的優惠券還空空的喔！
    </div>

    <div v-else>
      <div class="divider py-4 mb-12">尚未使用</div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
        <BenefitCard
          v-for="benefit in availableBenefits"
          :key="benefit.id"
          :benefit="benefit"
        />
      </div>
    </div>

    <div v-if="usedOrExpiredBenefits.length > 0">
      <div class="divider py-4 my-12">已使用 或 已過期</div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
        <BenefitCard
          v-for="benefit in usedOrExpiredBenefits"
          :key="benefit.id"
          :benefit="benefit"
        />
      </div>
    </div>
  </div>
</template>