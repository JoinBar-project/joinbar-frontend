<script setup>
import { allBadges } from '@/data/badges'

// 將徽章資料轉換成 key → 圖片 map
const badgeMap = allBadges.reduce((acc, badge) => {
  acc[badge.key] = badge.image
  return acc
}, {})
</script>

<template>
  <div class="max-w-7xl mx-auto p-6">
    <div class="text-5xl text-center py-14 font-bold">專屬會員權益</div>

    <div class="grid grid-cols-4 text-center text-xl rounded-lg overflow-hidden shadow-lg border border-gray-200">
      <!-- 標題列 -->
      <div class="bg-black/70 text-white font-semibold py-6"></div>
      <div class="bg-black/70 text-white font-semibold py-6">尊爵黑卡</div>
      <div class="bg-black/70 text-white font-semibold py-6">季訂方案</div>
      <div class="bg-black/70 text-white font-semibold py-6">小資月卡</div>

      <!-- 價格列 -->
      <div class="font-medium py-6">價格／天數</div>
      <div class="py-6">$2,999 / 365 天</div>
      <div class="py-6">$1,999 / 90 天</div>
      <div class="py-6">$999 / 30 天</div>

      <!-- 好禮 -->
      <div class="bg-black/70 text-white font-medium py-6">享有好禮</div>
      <div class="bg-black/70 py-6">VIP 專屬特調</div>
      <div class="bg-black/70 py-6">合作酒吧招待飲品</div>
      <div class="bg-black/70 py-6">合作酒吧招待小點</div>

      <!-- 專屬活動 -->
      <div class="font-medium py-6">專屬活動邀請</div>
      <div class="py-6"><i class="fa-solid fa-check text-[var(--color-primary-orange)]"></i></div>
      <div class="py-6"></div>
      <div class="py-6"></div>

      <!-- 生日禮物 -->
      <div class="bg-black/70 text-white font-medium py-6">生日專屬禮物</div>
      <div class="bg-black/70 py-6"><i class="fa-solid fa-check text-[var(--color-primary-orange)]"></i></div>
      <div class="bg-black/70 py-6"><i class="fa-solid fa-check text-[var(--color-primary-orange)]"></i></div>
      <div class="bg-black/70 py-6"></div>

      <!-- 專屬徽章 -->
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

    <!-- 備註說明 -->
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
</template>
