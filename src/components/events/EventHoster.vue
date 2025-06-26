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
  '今晚不醉不歸，但記得回家 😎'
]

onMounted(() => {
  const index = Math.floor(Math.random() * subtitles.length)
  subtitle.value = subtitles[index]
})

const subscriptions = ref([])

onMounted(async () => {
  try {
    const data = await getUserSubscriptionHistory(hostUser.value.id)
    console.log('主辦人訂閱紀錄:', data)  // ⬅️ 確認這裡有 ['monthly', 'seasonal', 'vip'] 之類
    subscriptions.value = data
  } catch (err) {
    console.warn('🚫 無法取得主辦人訂閱記錄')
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
  <div class="w-full pt-8 flex justify-center items-center">
    <div class="w-full max-w-[1200px] min-w-[1000px] bg-gray-100 rounded-2xl pb-10">

      <div class="w-full max-w-[1036px] mx-auto grid grid-cols-9 gap-5">
        <div class="col-span-2 text-center bg-[var(--color-primary-orange)] text-white rounded-b-2xl py-2 text-lg">
        活動發起人
        </div>
        <div class="col-span-2 row-span-2 flex items-center">
          <img 
            :src="hostUser.avatarUrl || defaultAvatar"      
            class="w-full aspect-square bg-yellow-100 rounded-full object-cover" 
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
            class="bg-[var(--color-secondary-green)] p-[10px] max-w-[175px] w-[175px] border-0 
            rounded-[30px] text-[20px] font-bold cursor-pointer mt-[20px] hover:bg-[var(--color-primary-orange)] text-white"
          >
            {{ toggleFollow ? '已 追 蹤' : '追 蹤' }}
          </button>
        </div>
        <div class="col-start-6 col-span-4 row-start-2 max-w-[451px] w-full flex items-center text-center mt-[10px]">
          <div class="trigle"></div>
          <p class="bg-white rounded-[10px] p-[10px] w-full text-[20px]">{{ subtitle }}</p>
        </div>

        <div class="col-start-6 col-span-4 row-start-3 grid grid-cols-4 gap-2 items-center justify-items-center">
          <div
            v-for="badge in showBadges"
            :key="badge.key"
            class="text-center w-[80px] h-[80px]"
          >
            <img class="badge-img" :src="badge.image" :alt="badge.name">
            <p class="pt-[10px] text-base text-center">{{ badge.name }}</p>
          </div>
        </div>
        
      </div>      
    </div>
  </div>

</template>

<style scoped>


.trigle{
  width: 14px;
  height: 14px;
  clip-path: polygon(100% 0, 0 50%, 100% 100%);
  background-color: #fff;
}

.badge-img{
  width: 100%;
  aspect-ratio: 1 / 1; 
  object-fit: cover; 
}

</style>