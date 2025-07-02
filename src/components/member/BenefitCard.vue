<script setup>
import { ref, computed, onMounted } from 'vue'
import dayjs from 'dayjs'
import { updateBenefitStatus } from '@/api/memberCard'
import vipCocktail from '@/assets/benefit/vip-cocktail.jpg'
import cocktail from '@/assets/benefit/cocktail.jpg'
import snake from '@/assets/benefit/snake.jpg'

const { benefit } = defineProps({
  benefit: Object,
})

const dateRange = computed(() => {
  return `${dayjs(benefit.startAt).format('YYYY-MM-DD')} ~ ${dayjs(benefit.endAt).format('YYYY-MM-DD')}`
})

const status = computed(() => benefit.status)
const isUsed = computed(() => status.value === 2)
const isExpired = computed(() => status.value === 3)

const barOptions = ref([
  { id: 1, name: '醉後不歸路' },
  { id: 2, name: '夜色迷醉' },
  { id: 3, name: '貓吧 Meow Bar' },
  { id: 4, name: '微醺時光' },
  { id: 5, name: '深夜酒館' },
]);

const showBenefitModal = ref(false)
const selectBar = ref(benefit.barId || '')
const showSelecBarModal = ref(false)

function toggleModal(){
  if( !selectBar.value ){
    showSelecBarModal.value = true
  }else{
    showBenefitModal.value = true
  }
}

function handleConfirmSelecBarModal(){
  showSelecBarModal.value = false
}

function closeCancelRedeemModal(){
  showBenefitModal.value = false
}

async function handleConfirmRedeemModal(){
  try{
    await updateBenefitStatus({
      benefitId: benefit.id,
      barId: selectBar.value
    });

    benefit.status = 2
    benefit.barId = selectBar.value;
    showBenefitModal.value = false
  }catch(err){
    console.error(err)
  }
}

const imageMap = {
  'VIP 專屬特調 1 次': vipCocktail,
  '合作酒吧招待飲品 1 次': cocktail,
  '合作酒吧招待小點 1 次': snake
}

const imageUrl = computed(() => imageMap[benefit.benefit] || cocktail)
</script>

<template>
  <div class="w-full max-w-xl shadow-sm card md:card-side bg-base-100 md:max-h-70">
    <figure class="aspect-square md:aspect-auto overflow-hidden relative w-full md:w-[40%] h-48 md:h-auto">
      <img
        class="object-cover w-full h-full"
        :src="imageUrl"
        alt="imageUrl"
      />
      <div class="absolute bottom-0 left-0 flex items-center justify-center w-full h-8 text-xs text-center text-white md:h-10 bg-black/80 md:text-sm">
        <p>開車不喝酒，喝酒不開車</p>
      </div>
    </figure>
    
    <div class="flex-1 p-4 md:pt-2 md:pl-4">
      <h2 class="card-title text-[var(--color-primary-red)] py-2 text-lg md:text-xl">{{ benefit.benefit }}</h2>
      
      <div class="space-y-1 md:space-y-0">
        <p class="text-sm text-gray-700">票號：<span class="text-sm text-gray-500">{{ benefit.id }}</span></p>
        <p class="text-sm">使用時間：<span class="text-sm py-2 font-bold text-[var(--color-primary-red)]">{{ dateRange }}</span></p>
      </div>

      <div class="mt-3 md:mt-2">
        <p class="text-xs text-gray-700">注意事項：</p>
        <p class="text-xs text-gray-500">
          限定五家酒吧使用<br />
          照片僅供參考，以店家提供為主
        </p>
      </div>
      
      <div class="flex flex-col gap-2 mt-4 md:flex-row md:gap-0 md:mt-2">
        <select
          v-model="selectBar"
          :disabled="isUsed || isExpired"
          class="select bg-white border-[2px] 
          border-[var(--color-primary-orange)] 
          focus:outline-none w-full md:w-auto md:mr-2"
        >
          <option disabled value="">選擇酒吧</option>
          <option 
            v-for="bar in barOptions" 
            :key="bar.id"
            :value="bar.id"
          >
            {{ bar.name }}
          </option>
        </select>
        
        <button 
          @click="toggleModal"
          :disabled="isUsed || isExpired"
          type="button"
          class="btn text-white bg-[var(--color-primary-red)]
          hover:bg-[var(--color-primary-orange)] w-full md:w-auto">
          {{ 
            isUsed ? '已使用' :
            isExpired ? '已過期' :
            '使用優惠券'
          }}
        </button>
      </div>
    </div>
  </div>

  <div v-if="showSelecBarModal" class="modal modal-open">
    <div class="max-w-sm modal-box md:max-w-md">
      <h3 class="text-lg font-bold">提醒</h3>
      <p class="py-4">請先選擇酒吧</p>
      <div class="modal-action">
        <form method="dialog">
          <button @click="handleConfirmSelecBarModal" type="button" class="btn">確認</button>
        </form>
      </div>
    </div>
  </div>

  <div v-if="showBenefitModal" class="modal modal-open">
    <div class="max-w-sm modal-box md:max-w-md">
      <h3 class="text-lg font-bold">使用優惠券</h3>
      <p class="py-4">您確定要使用優惠券嗎？</p>
      <div class="modal-action">
        <form method="dialog">
          <button @click="closeCancelRedeemModal" type="button" class="mx-2 btn">取消</button>
          <button @click="handleConfirmRedeemModal" type="button" class="btn">確認</button>
        </form>
      </div>
    </div>
  </div>
</template>