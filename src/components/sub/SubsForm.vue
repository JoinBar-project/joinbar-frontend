<script setup>
import { allBadges } from '@/data/badges'

// 將徽章資料轉換成 key → 圖片 map
const badgeMap = allBadges.reduce((acc, badge) => {
  acc[badge.key] = badge.image
  return acc
}, {})
</script>

<template>
  <div class="max-w-7xl mx-auto">
    <div class="text-5xl text-center pb-20 font-bold">專屬會員權益</div>

    <div class="grid grid-cols-4 text-center text-xl rounded-lg overflow-hidden shadow-lg border border-gray-200">

      <div class="bg-[var(--color-secondary-green)]/70 text-white font-semibold py-6"></div>
      <div class="bg-[var(--color-secondary-green)]/70 text-white font-semibold py-6">尊爵黑卡</div>
      <div class="bg-[var(--color-secondary-green)]/70 text-white font-semibold py-6">季訂方案</div>
      <div class="bg-[var(--color-secondary-green)]/70 text-white font-semibold py-6">小資月卡</div>

      <div class="font-medium py-6">價格／天數</div>
      <div class="py-6">$2,999 / 365 天</div>
      <div class="py-6">$1,999 / 90 天</div>
      <div class="py-6">$999 / 30 天</div>

      <div class="bg-[var(--color-secondary-green)]/70 text-white font-medium py-6">享有好禮</div>
      <div class="bg-[var(--color-secondary-green)]/70 text-white font-medium py-6">VIP 專屬特調</div>
      <div class="bg-[var(--color-secondary-green)]/70 text-white font-medium py-6">合作酒吧招待飲品</div>
      <div class="bg-[var(--color-secondary-green)]/70 text-white font-medium py-6">合作酒吧招待小點</div>

      <div class="font-medium py-6">專屬活動邀請</div>
      <div class="py-6"><i class="fa-solid fa-check text-[var(--color-primary-red)]"></i></div>
      <div class="py-6"></div>
      <div class="py-6"></div>

      <div class="bg-[var(--color-secondary-green)]/70 text-white font-medium py-6">生日專屬禮物</div>
      <div class="bg-[var(--color-secondary-green)]/70 text-white font-medium py-6"><i class="fa-solid fa-check text-[var(--color-primary-red)] font-medium"></i></div>
      <div class="bg-[var(--color-secondary-green)]/70 text-white font-medium py-6"><i class="fa-solid fa-check text-[var(--color-primary-red)] font-medium"></i></div>
      <div class="bg-[var(--color-secondary-green)]/70 text-white font-medium py-6"></div>

      <div class="font-medium py-6 flex items-center justify-center">專屬徽章</div>
      <div class="py-6 flex flex-col items-center">
        <img :src="badgeMap['vip']" class="w-12 h-12 mb-2" />
        黑卡徽章
      </div>
      <div class="py-6 flex flex-col items-center">
        <img :src="badgeMap['seasonal']" class="w-12 h-12 mb-2" />
        季卡徽章
      </div>
      <div class="py-6 flex flex-col items-center">
        <img :src="badgeMap['monthly']" class="w-12 h-12 mb-2" />
        月卡徽章
      </div>
    </div>

    <div class="mt-10 text-base leading-relaxed">
      <h4 class="text-xl font-semibold mb-3">
        說明：
      </h4>
      <ul class="list-none space-y-2">
        <li><i class="fa-solid fa-crown text-yellow-500 mr-2"></i>好禮可兌換五家指定合作酒吧</li>
        <li><i class="fa-solid fa-crown text-yellow-500 mr-2"></i>專屬活動將不定期以 E-mail 通知參加方式</li>
        <li><i class="fa-solid fa-crown text-yellow-500 mr-2"></i>生日專屬禮物會依 E-mail 通知領取／兌換方式</li>
      </ul>
    </div>
  </div>
  <div class="flex justify-center my-35">
    <div class="w-120 h-1 bg-gradient-to-r from-transparent via-[#afb18c] through-[#e1ac67] to-transparent rounded-full shadow-lg">
    </div>
  </div>
</template>
