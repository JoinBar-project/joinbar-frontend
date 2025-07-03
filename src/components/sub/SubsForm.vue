<script setup>
import { allBadges } from '@/data/badges'

// 將徽章資料轉換成 key → 圖片 map
const badgeMap = allBadges.reduce((acc, badge) => {
  acc[badge.key] = badge.image
  return acc
}, {})
</script>

<template>
  <div class="md:max-w-7xl mx-6 md:mx-auto">
    <div class="text-4xl md:text-5xl text-center py-10 md:pb-20 font-bold">專屬會員權益</div>

    <div class="grid grid-cols-4 text-center text-xl rounded-lg overflow-hidden shadow-lg border border-gray-200">

      <div class="bg-[var(--color-secondary-green)]/70 text-white font-semibold py-6 text-sm md:text-xl"></div>
      <div class="bg-[var(--color-secondary-green)]/70 text-white font-semibold py-6 text-sm md:text-xl">尊爵黑卡<br/>365 天</div>
      <div class="bg-[var(--color-secondary-green)]/70 text-white font-semibold py-6 text-sm md:text-xl">季訂方案<br/>90 天</div>
      <div class="bg-[var(--color-secondary-green)]/70 text-white font-semibold py-6 text-sm md:text-xl">小資月卡<br/>30 天</div>

      <div class="font-medium py-6 text-xs pl-2 text-left md:text-center md:pl-0 md:text-xl">價格／天數</div>
      <div class="py-6 text-xs md:text-xl">$2,999</div>
      <div class="py-6 text-xs md:text-xl">$1,999</div>
      <div class="py-6 text-xs md:text-xl">$999</div>

      <div class="bg-[var(--color-secondary-green)]/70 text-left md:text-center text-white font-medium py-6 text-xs pl-2 md:pl-0 md:text-xl">享有好禮</div>
      <div class="bg-[var(--color-secondary-green)]/70 text-white font-medium py-6 text-xs md:text-xl">VIP 專屬特調</div>
      <div class="bg-[var(--color-secondary-green)]/70 text-white font-medium py-6 text-xs md:text-xl">合作酒吧招待飲品</div>
      <div class="bg-[var(--color-secondary-green)]/70 text-white font-medium py-6 text-xs md:text-xl">合作酒吧招待小點</div>

      <div class="font-medium text-left md:text-center py-6 text-xs pl-2 md:pl-0 md:text-xl">專屬活動邀請</div>
      <div class="py-6 text-xs md:text-xl"><i class="fa-solid fa-check text-[var(--color-primary-red)]"></i></div>
      <div class="py-6 text-xs md:text-xl"></div>
      <div class="py-6 text-xs md:text-xl"></div>

      <div class="bg-[var(--color-secondary-green)]/70 text-white text-left md:text-center font-medium py-6 text-xs pl-2 md:pl-0 md:text-xl">生日專屬禮物</div>
      <div class="bg-[var(--color-secondary-green)]/70 text-white font-medium py-6 text-xs md:text-xl"><i class="fa-solid fa-check text-[var(--color-primary-red)] font-medium"></i></div>
      <div class="bg-[var(--color-secondary-green)]/70 text-white font-medium py-6 text-xs md:text-xl"><i class="fa-solid fa-check text-[var(--color-primary-red)] font-medium"></i></div>
      <div class="bg-[var(--color-secondary-green)]/70 text-white font-medium py-6 text-xs md:text-xl"></div>

      <div class="font-medium py-6 text-xs md:text-xl flex items-center text-left pl-2 md:pl-0 md:text-center md:justify-center">專屬徽章</div>
      <div class="py-6 text-xs md:text-xl flex flex-col items-center">
        <img :src="badgeMap['vip']" class="w-12 h-12 mb-2" />
        黑卡徽章
      </div>
      <div class="py-6 text-xs md:text-xl flex flex-col items-center">
        <img :src="badgeMap['seasonal']" class="w-12 h-12 mb-2" />
        季卡徽章
      </div>
      <div class="py-6 text-xs md:text-xl flex flex-col items-center">
        <img :src="badgeMap['monthly']" class="w-12 h-12 mb-2" />
        月卡徽章
      </div>
    </div>

    <div class="mt-10 text-base leading-relaxed">
      <h4 class="text-sm md:text-xl font-semibold mb-3">
        說明：
      </h4>
      <ul class="list-none space-y-2">
        <span class="text-xs md:text-base"><i class="fa-solid fa-crown text-yellow-500 mr-2"></i>好禮可兌換五家指定合作酒吧</span><br />
        <span class="text-xs md:text-base"><i class="fa-solid fa-crown text-yellow-500 mr-2"></i>專屬活動將不定期以 E-mail 通知參加方式</span><br />
        <span class="text-xs md:text-base"><i class="fa-solid fa-crown text-yellow-500 mr-2"></i>生日專屬禮物會依 E-mail 通知領取／兌換方式</span><br />
      </ul>
    </div>
  </div>
  <div class="flex justify-center my-10 md:my-35">
    <div class="w-120 h-1 bg-gradient-to-r from-transparent via-[#afb18c] through-[#e1ac67] to-transparent rounded-full shadow-lg">
    </div>
  </div>
</template>
