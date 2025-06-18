<script setup>
import { computed } from 'vue'
import dayjs from 'dayjs'
import foodImage from '@/views/member/profile/picture/img-food.jpg'

const props = defineProps({
  benefit: Object,
})

const dateRange = computed(() => {
  return `${dayjs(props.benefit.startAt).format('YYYY-MM-DD')} ~ ${dayjs(props.benefit.endAt).format('YYYY-MM-DD')}`
})
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
      <p class="text-sm">票號：{{ benefit.id }}</p>
      <p class="text-sm">使用時間：<span class="text-sm py-2 font-bold text-[var(--color-primary-red)]">{{ dateRange }}</span></p>

      <p class="text-xs font-bold pt-2">注意事項：</p>
      <p class="text-xs">
        限定五家酒吧使用<br />
        照片僅供參考，以店家提供為主
      </p>
      <div class="flex">
        <select class="select bg-white border-[2px] border-[var(--color-primary-orange)] hover:border-[var(--color-primary-orange)] focus:border-[var(--color-primary-orange)] focus:outline-none mt-2">
          <option selected disabled>選擇酒吧優惠</option>
          <option>醉後不歸路</option>
          <option>夜色迷醉</option>
          <option>貓吧 Meow Bar</option>
          <option>微醺時光</option>
          <option>深夜酒館</option>
        </select>
        <button class="btn text-white bg-[var(--color-primary-red)] hover:bg-[var(--color-primary-orange)] mt-2">使用優惠券</button>
      </div>

    </div>
  </div>
</template>
