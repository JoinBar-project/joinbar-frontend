<script setup>
import { ref, computed, onMounted } from 'vue'
import { allBadges } from '@/data/badges'
import { getUserSubscriptionHistory } from '@/api/subsCard'

const props = defineProps({
  user: {
    type: Object,
    required: true,
  }
})

const hostUser = computed(() => props.user)
const defaultAvatar = new URL('@/components/events/picture/大頭照.png', import.meta.url).href;


const followHost = (hostId) => {
  const raw = localStorage.getItem('followedHosts') || '[]'
  const followed = JSON.parse(raw)
  if (!followed.includes(hostId)) {
    followed.push(hostId)
    localStorage.setItem('followedHosts', JSON.stringify(followed))
  }
}

const unfollowHost = (hostId) => {
  const raw = localStorage.getItem('followedHosts') || '[]'
  const followed = JSON.parse(raw)
  const updated = followed.filter(id => id !== hostId)
  localStorage.setItem('followedHosts', JSON.stringify(updated))
}

const isFollowing = (hostId) => {
  const raw = localStorage.getItem('followedHosts') || '[]'
  const followed = JSON.parse(raw)
  return followed.includes(hostId)
}

const toggleFollow = ref(isFollowing(hostUser.value.id))

const handleFollowClick = () => {
  if (toggleFollow.value) {
    unfollowHost(hostUser.value.id)
  } else {
    followHost(hostUser.value.id)
  }
  toggleFollow.value = !toggleFollow.value
}

const subtitle = ref('')

const subtitles = [
  '喜歡喝酒，不喜歡喝醉 🔥',
  '今晚喝一杯，明天不後悔 🍻',
  '來一杯，認識新朋友 👯‍♂️',
  '喝的是酒，聊的是人生 🥂',
  '今晚不醉不歸，但記得回家 😎',
  '愛上一個人不如愛上一家酒吧 💘',
  '我戒酒了，只喝含酒的飲料而已 🍹',
  '酒不醉人人自醉 ~ 看帳單的時候最清醒 🥴'
]

onMounted(() => {
  const index = Math.floor(Math.random() * subtitles.length)
  subtitle.value = subtitles[index]
})

const subscriptions = ref([])

onMounted(async () => {
  try {
    const data = await getUserSubscriptionHistory(hostUser.value.id)
    subscriptions.value = data
  } catch (err) {
    console.warn('無法取得主辦人訂閱記錄')
  }
})

const showBadges = computed(() => {
  const userSubTypes = subscriptions.value.map(sub => sub.subType)
  const badgeKeys = ['newbie']
  if (userSubTypes.includes('monthly')) badgeKeys.push('monthly')
  if (userSubTypes.includes('seasonal')) badgeKeys.push('seasonal')
  if (userSubTypes.includes('vip')) badgeKeys.push('vip')

  return allBadges.filter(b => badgeKeys.includes(b.key))
})

</script>

<template>
  <div class="flex items-center justify-center w-full px-4 pt-8 md:pt-12 md:px-0">
    <div class="w-full max-w-7xl md:max-w-[1200px] md:min-w-[1000px] bg-gray-100 rounded-xl md:rounded-2xl pb-6 md:pb-10">

      <!-- 手機版佈局 -->
      <div class="block md:hidden">
        <!-- 標題 -->
        <div class="w-full py-3 text-lg font-medium text-center text-white bg-orange-500 rounded-t-xl">
          活動發起人
        </div>
        
        <!-- 內容區域 -->
        <div class="p-6 space-y-6">
          <!-- 頭像和基本資訊 -->
          <div class="flex items-center space-x-4">
            <div class="flex-shrink-0 w-20 h-20">
              <img 
                :src="hostUser.avatarUrl || defaultAvatar"      
                class="object-cover w-full h-full bg-yellow-100 rounded-full" 
                alt="大頭照"
              >
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xl font-medium text-gray-900 truncate">
                {{ hostUser.username }}
              </p>
              <p class="text-sm text-gray-600 truncate">
                {{ `@ ${hostUser.nickname}` }}
              </p>
            </div>
          </div>

          <!-- 追蹤按鈕 -->
          <div class="flex justify-center">
            <button 
              @click="handleFollowClick" 
              :class="[
                'px-8 py-3 border-0 rounded-full text-lg font-bold cursor-pointer text-white transition-colors duration-200 w-full max-w-xs',
                toggleFollow 
                  ? 'bg-orange-500'
                  : 'bg-green-600 hover:bg-orange-500'
              ]"
            >
              {{ toggleFollow ? '已 追 蹤' : '追 蹤' }}
            </button>
          </div>

          <!-- 對話框 -->
          <div class="relative">
            <div class="flex items-start">
              <div class="triangle-mobile"></div>
              <div class="flex-1 p-4 ml-1 bg-white rounded-lg">
                <p class="text-base leading-relaxed text-gray-800">{{ subtitle }}</p>
              </div>
            </div>
          </div>

          <!-- 徽章區域 -->
          <div class="grid grid-cols-4 gap-3 justify-items-center">
            <div
              v-for="badge in showBadges"
              :key="badge.key"
              class="text-center"
            >
              <div class="w-12 h-12 mx-auto md:w-16 md:h-16">
                <img class="object-cover w-full h-full rounded" :src="badge.image" :alt="badge.name">
              </div>
              <p class="pt-2 text-xs text-center text-gray-700">{{ badge.name }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 桌面版佈局 -->
      <div class="hidden md:block">
        <div class="w-full max-w-[1036px] mx-auto grid grid-cols-9 gap-5">
          <div class="col-span-2 py-2 text-lg text-center text-white bg-orange-500 rounded-b-2xl">
            活動發起人
          </div>
          <div class="flex items-center col-span-2 row-span-2">
            <img 
              :src="hostUser.avatarUrl || defaultAvatar"      
              class="object-cover w-full bg-yellow-100 rounded-full aspect-square" 
              alt="大頭照"
            >
          </div>
          <div class="flex flex-col col-start-3 col-span-2 row-start-2 row-span-2 items-center text-center mt-[25px]">
            <div class="items-center">
              <p class="leading-[1.8] w-full m-0 text-[30px] max-w-[175px] overflow-hidden truncate whitespace-nowrap">
                {{ hostUser.username }}</p>
              <p class="leading-[1.8] w-full m-0 text-[18px] pb-[20px]">{{ `@ ${hostUser.nickname}` }}</p>
            </div>
            <button 
              @click="handleFollowClick" 
              :class="[
                'p-[10px] max-w-[175px] w-[175px] border-0 rounded-[30px] text-[20px] font-bold cursor-pointer text-white transition-colors duration-200',
                toggleFollow 
                  ? 'bg-orange-500'
                  : 'bg-green-600 hover:bg-orange-500'
              ]"
            >
              {{ toggleFollow ? '已 追 蹤' : '追 蹤' }}
            </button>
          </div>
          <div class="col-start-6 col-span-4 row-start-2 max-w-[451px] w-full flex items-center text-center mt-[10px]">
            <div class="triangle"></div>
            <p class="bg-white rounded-[10px] p-[10px] w-full text-[20px]">{{ subtitle }}</p>
          </div>

          <div class="grid items-center grid-cols-4 col-span-4 col-start-6 row-start-3 gap-2 justify-items-center">
            <div
              v-for="badge in showBadges"
              :key="badge.key"
              class="text-center w-[80px] h-[80px]"
            >
              <img class="object-cover w-full aspect-square" :src="badge.image" :alt="badge.name">
              <p class="pt-[10px] text-base text-center">{{ badge.name }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 桌面版三角形 */
.triangle {
  width: 14px;
  height: 14px;
  clip-path: polygon(100% 0, 0 50%, 100% 100%);
  background-color: #fff;
}

/* 手機版三角形 */
.triangle-mobile {
  width: 12px;
  height: 12px;
  clip-path: polygon(100% 0, 0 50%, 100% 100%);
  background-color: #fff;
  flex-shrink: 0;
  margin-top: 12px;
}

/* 確保在小螢幕上內容不會被遮擋 */
@media (max-width: 767px) {
  .triangle-mobile {
    margin-top: 8px;
  }
}
</style>