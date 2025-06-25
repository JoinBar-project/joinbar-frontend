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

onMounted( async() => {
  try{
    const sub = await getUserSubscriptionHistory(hostUser.value.id)
    console.log('該主辦人的訂閱記錄:', subs)

    const hasMonthly = subs.some(sub => sub.subType == 'monthly')
    const hasSeasonal  = subs.some(sub => sub.subType == 'seasonal')
    const hasVip  = subs.some(sub => sub.subType == 'vip')

  }catch (err){
    console.warn('取得主辦人訂閱歷史失敗')
  }
})

const showBadges = computed(() => {
  const badgeList = []

  badgeList.push(allBadges.find(b => b.subType === 'newbie'))

  if (subscriptions.value.some(sub => sub.subType === 'monthly')) {
    badgeList.push(allBadges.find(b => b.subType === 'monthly'))
  }

  if (subscriptions.value.some(sub => sub.subType === 'seasonal')) {
    badgeList.push(allBadges.find(b => b.subType === 'seasonal'))
  }

  if (subscriptions.value.some(sub => sub.subType === 'vip')) {
    badgeList.push(allBadges.find(b => b.subType === 'vip'))
  }

  return badgeList
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
            <p class="leading-[1.8] w-full m-0 text-[30px] max-w-[175px] overflow-hidden truncate whitespace-nowrap">{{ hostUser.username }}</p>
            <p class="leading-[1.8] w-full m-0 text-[18px] pb-[40px]">{{ `@ ${hostUser.nickname}` }}</p>
          </div>
          <button @click="handleFollowClick" class="bg-[var(--color-secondary-green)] p-[10px] max-w-[175px] w-[175px] border-0 rounded-[30px] text-[20px] font-bold cursor-pointer mt-[40px] hover:bg-[var(--color-primary-orange)] text-white">
            {{ toggleFollow ? '已 追 蹤' : '追 蹤' }}
          </button>
        </div>
        <div class="col-start-6 col-span-4 row-start-2 max-w-[451px] w-full flex items-center text-center mt-[10px]">
          <div class="trigle"></div>
          <p class="bg-white rounded-[10px] p-[10px] w-full text-[20px]">{{ subtitle }}</p>
        </div>
        <template v-for="(badge, index) in showBadges" :key="badge.subType">
          <div :class="`block text-center w-[80px] h-[80px] col-start-${6 + index} col-span-1 row-start-3`">
            <div>
              <img class="badge-img" :src="badge.image" :alt="badge.title">
            </div>
            <p class="pt-[30px]">{{ badge.title }}</p>
          </div>
        </template>
      </div>      
    </div>
  </div>

</template>

<style scoped>

/* .event-hoster-section{
  max-width: 100vw;
  padding-top: 2%;
  display: flex;
  justify-content: center;
  align-items: center;
} */

/* .event-hoster-card{
  max-width: 1200px;
  min-width: 1000px;
  width: 100%;
  background-color: #f1f1f1;
  padding-bottom: 40px;
  margin: 0 auto;
  border-radius: 20px;
} */

/* .event-main-content{
  max-width: 1036px;
  width: 100%;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  gap: 20px;

} */

/* .event-initiator{
  padding: 10px 40px 10px 40px;
  font-size: 20px;
  margin: 0;
  text-align: center;
  background-color: var(--color-primary-orange);
  color: white;
  border-radius: 0 0px 20px 20px;
  grid-column: 1 / span 2; grid-row: 1;
} */

/* .headshot{
  grid-column: 1 / span 2;
  grid-row: 2 / span 2;
  display: flex;
  align-items: center;
} */

/* .headshot img{
  width: 100%;
  background-color: #d4cbb1;
  aspect-ratio: 1 / 1;
  border-radius: 100%;
  object-fit: cover;
} */

/* .hoster-info{
  display: flex;
  flex-direction: column;
  grid-column: 3/ span 2;
  grid-row: 2 / span 2;
  align-items: center;
  text-align: center;
  justify-content: top;
  margin-top: 25px;
} */

/* .hoster-account{
  align-items: center;
} */

/* .hoster-name,
.account-number{
  line-height: 1.8;
  width: 100%;
  margin: 0;
} */

/* .hoster-name{
  font-size: 30px;
  max-width: 175px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
} */

/* .account-number{
  font-size: 18px;
  padding-bottom: 40px;
} */

/* .follow-btn{
  background-color: var(--color-secondary-green);
  padding: 10px;
  max-width: 175px;
  width: 175px;
  border: 0 solid;
  border-radius: 30px;
  font-size: 20px;
  font-weight: bold;  
  cursor: pointer;
  margin-top: 40px;
} */

/* .follow-btn:hover{
  background-color: var(--color-primary-orange);
  color: white;
} */

/* .hoster-message{
  grid-column: 6 / span 4; grid-row: 2;
  max-width: 451px;
  width: 100%;
  display: flex;
  align-items: center;
  text-align: center;
  margin-top: 10px;
} */

/* .hoster-message>p{
  background-color: #fff;
  border-radius: 10px;
  padding: 10px;
  width: 100%;
  font-size: 18px;
} */

.trigle{
  width: 14px;
  height: 14px;
  clip-path: polygon(100% 0, 0 50%, 100% 100%);
  background-color: #fff;
}

/* .badge{
  display: block;
  text-align: center;
  width: 80px;
  height: 80px;
} */

/* .badge-title{
  padding-top: 50px;
} */

/* .badge-card-1{
  grid-column: 6 / span 1; grid-row: 3;
  align-items: center;
}

.badge-card-2{
  grid-column: 7 / span 1; grid-row: 3;
}

.badge-card-3{
  grid-column: 8 / span 1; grid-row: 3;
}

.badge-card-4{
  grid-column: 9 / span 1; grid-row: 3;
} */

.badge-img{
  width: 100%;
  aspect-ratio: 1 / 1; 
  object-fit: cover; 
}

</style>