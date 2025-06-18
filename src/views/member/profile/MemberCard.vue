<script setup>
import foodImage from '@/views/member/profile/picture/img-food.jpg'


</script>

<template>
  <div class="p-4">
    <div class="text-center text-gray-500 py-16 text-lg">
      目前你的優惠券還空空的喔！
    </div>
    <div class="divider py-4 mb-12">尚未使用</div>

    <!-- ✅ 一個 grid 裝所有卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
      
      <!-- ✨ 卡片 1 -->
      <div class="card card-side bg-base-100 shadow-sm w-full max-w-xl max-h-70">
        <figure class="aspect-square overflow-hidden relative">
          <img
            class="w-full h-full object-cover"
            :src="foodImage" 
            alt="foodImage"
          />
          <div class="absolute bottom-0 left-0 w-full h-10 bg-black/80 text-white text-center text-sm flex items-center justify-center">
            <p>開車不喝酒，喝酒不開車</p>
          </div>
        </figure>
        <div class="px-4 py-4">
          <h2 class="card-title text-[var(--color-primary-red)]">優惠券</h2>
          <p class="text-sm py-2">票號：</p>
          <p class="text-sm font-bold">注意事項：</p>
          <p class="text-sm">限定五家酒吧使用<br/>照片僅供參考，以店家提供為主</p>
          <select class="select bg-white border-[2px] border-[var(--color-primary-orange)] hover:border-[var(--color-primary-orange)] focus:border-[var(--color-primary-orange)] focus:outline-none mt-4">
            <option selected disabled>選擇酒吧優惠</option>
            <option>醉後不歸路</option>
            <option>夜色迷醉</option>
            <option>貓吧 Meow Bar</option>
            <option>微醺時光</option>
            <option>深夜酒館</option>
          </select>
          <div class="card-actions justify-end">
            <button class="btn text-white bg-[var(--color-primary-red)] hover:bg-[var(--color-primary-orange)] mt-4">使用優惠券</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>