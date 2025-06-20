<script setup>
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import foodImage from '@/views/member/profile/picture/img-wine.jpg'
import { updateBenefitStatus } from '@/api/memberCard'

const { benefit } = defineProps({
  benefit: Object,
})

const dateRange = computed(() => {
  return `${dayjs(benefit.startAt).format('YYYY-MM-DD')} ~ ${dayjs(benefit.endAt).format('YYYY-MM-DD')}`
})

const barOptions = ref([
  { id: 1, name: '醉後不歸路' },
  { id: 2, name: '夜色迷醉' },
  { id: 3, name: '貓吧 Meow Bar' },
  { id: 4, name: '微醺時光' },
  { id: 5, name: '深夜酒館' },
]);

const showBenefitModal = ref(false)
const selectBar = ref('')
const isRedeemed = ref(false)
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

    isRedeemed.value = true
    showBenefitModal.value = false
  }catch(err){
    console.error(err)
  }
}


</script>

<template>
  <div class="card card-side bg-base-100 shadow-sm w-full max-w-xl max-h-70">
    <figure class="aspect-square overflow-hidden relative w-[40%]">
      <img
        class="w-full h-full object-cover"
        :src="foodImage"
        alt="foodImage"
      />
      <div class="absolute bottom-0 left-0 w-full h-10 bg-black/80 text-white text-center text-sm flex items-center justify-center">
        <p>開車不喝酒，喝酒不開車</p>
      </div>
    </figure>
    <div class="pt-2 pl-4">
      <h2 class="card-title text-[var(--color-primary-red)] py-2">{{ benefit.benefit }}</h2>
      <p class="text-sm text-gray-700">票號：<span class="text-sm text-gray-500">{{ benefit.id }}</span></p>
      <p class="text-sm">使用時間：<span class="text-sm py-2 font-bold text-[var(--color-primary-red)]">{{ dateRange }}</span></p>

      <p class="text-xs pt-2 text-gray-700">注意事項：</p>
      <p class="text-xs text-gray-500">
        限定五家酒吧使用<br />
        照片僅供參考，以店家提供為主
      </p>
      <div class="flex">
        <select
          v-model="selectBar"
          :disabled="isRedeemed"
          class="select bg-white border-[2px] 
          border-[var(--color-primary-orange)] 
          focus:outline-none mt-2"
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
          :disabled="isRedeemed"
          type="button"
          class="btn text-white bg-[var(--color-primary-red)] hover:bg-[var(--color-primary-orange)] mt-2">
          {{ isRedeemed? '已使用' : '使用優惠券'}}
        </button>
      </div>
      
    </div>
  </div>

  <div v-if="showSelecBarModal" class="modal modal-open">
    <div class="modal-box">
      <h3 class="text-lg font-bold">提醒</h3>
      <p class="py-4">請先選擇酒吧</p>
      <div class="modal-action">
        <form method="dialog">
          <button @click="handleConfirmSelecBarModal" type="button" class="btn">確認</button>
        </form>
      </div>
    </div>
  </div >

  <div v-if="showBenefitModal" class="modal modal-open">
    <div class="modal-box">
      <h3 class="text-lg font-bold">使用優惠券</h3>
      <p class="py-4">您確定要使用優惠券嗎？</p>
      <div class="modal-action">
        <form method="dialog">
          <button @click="closeCancelRedeemModal" type="button" class="btn mx-2">取消</button>
          <button @click="handleConfirmRedeemModal" type="button" class="btn">確認</button>
        </form>
      </div>
    </div>
  </div >
</template>
