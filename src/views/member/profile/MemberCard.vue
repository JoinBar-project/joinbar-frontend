<script setup>
import { ref, onMounted } from 'vue'
import { getCanUseBenefit, getOverUseBenefit } from '@/api/memberCard'
import BenefitCard from '@/components/member/BenefitCard.vue'

const canUseBenefitList = ref([])
const overUseBenefitList = ref([])
const isLoading = ref(true);

const fetchBenefitData = async () => {
  try {
    const canUse = await getCanUseBenefit();
    const overUse = await getOverUseBenefit();

    canUseBenefitList.value = canUse;
    overUseBenefitList.value = overUse;
  } catch (err) {
    console.error('取得優惠券失敗', err);
  } finally {
    console.log('設定 isLoading = false');
    isLoading.value = false;
  }
};

onMounted(fetchBenefitData);
console.log('canUseBenefitList', canUseBenefitList.value);
console.log('isLoading', isLoading.value);

</script>

<template>
  <div class="p-4">
    <div v-if="isLoading" class="text-center text-gray-400 py-16 text-lg">載入中...</div>

    <template v-else>
      <div v-if="canUseBenefitList.length === 0" class="text-center text-gray-500 py-16 text-lg">
        目前你的優惠券還空空的喔！
      </div>

      <div v-else>
        <div class="divider py-4 mb-12">尚未使用</div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          <BenefitCard
            v-for="benefit in canUseBenefitList"
            :key="benefit.id"
            :benefit="benefit"
          />
        </div>
      </div>

      <div v-if="overUseBenefitList.length > 0">
        <div class="divider py-4 my-12">已使用 或 已過期</div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          <BenefitCard
            v-for="benefit in overUseBenefitList"
            :key="benefit.id"
            :benefit="benefit"
          />
        </div>
      </div>
    </template>
  </div>
</template>