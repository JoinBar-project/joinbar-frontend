<script setup>
import { computed } from 'vue'

const props = defineProps({
  user: {
    type: Object,
    required: true,
  }
})

const hostUser = computed(() => props.user)

const defaultAvatar = new URL('@/components/events/picture/大頭照.png', import.meta.url).href;



</script>

<template>
  <div class="event-hoster-section">
    <div class="event-hoster-card">

      <div class="event-main-content">
        <div class="event-initiator">
        活動發起人
        </div>
        <div class="headshot">
          <img :src="hostUser.avatarUrl || defaultAvatar" alt="大頭照">
        </div>
        <div class="hoster-info">
          <div class="hoster-account">
            <p class="hoster-name">{{ hostUser.username }}</p>
            <p class="account-number">{{ `@${hostUser.nickname}` }}</p>
          </div>
          <button class="follow-btn">追 蹤</button>
        </div>
        <div class="hoster-message">
          <div class="trigle"></div>
          <p>喜歡喝酒，不喜歡喝醉🔥</p>
        </div>
        <div class="badge badge-card-1">
          <div>
            <img class="badge-img" src="@/components/events/picture/榮譽icon.png" alt="新人登場">
          </div>
          <p class="badge-title">新人登場</p>
        </div>
        <div class="badge badge-card-2">
          <div>
            <img class="badge-img" src="@/components/events/picture/榮譽icon.png" alt="新人登場">
          </div>
          <p class="badge-title">新人登場</p>
        </div>
        <div class="badge badge-card-3">
          <div>
            <img class="badge-img" src="@/components/events/picture/榮譽icon.png" alt="新人登場">
          </div>
          <p class="badge-title">新人登場</p>
        </div>
        <div class="badge badge-card-4">
          <div>
            <img class="badge-img" src="@/components/events/picture/榮譽icon.png" alt="新人登場">
          </div>
          <p class="badge-title">新人登場</p>
        </div>
      </div>      
    </div>
  </div>

</template>

<style scoped>

.event-hoster-section{
  max-width: 100vw;
  padding-top: 2%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.event-hoster-card{
  max-width: 1200px;
  min-width: 1000px;
  width: 100%;
  background-color: #f1f1f1;
  padding-bottom: 40px;
  margin: 0 auto;
  border-radius: 20px;
}

.event-main-content{
  max-width: 1036px;
  width: 100%;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  gap: 20px;

}

.event-initiator{
  padding: 10px 40px 10px 40px;
  font-size: 20px;
  margin: 0;
  text-align: center;
  background-color: var(--color-primary-orange);
  color: white;
  border-radius: 0 0px 20px 20px;
  grid-column: 1 / span 2; grid-row: 1;
}

.headshot{
  grid-column: 1 / span 2;
  grid-row: 2 / span 2;
  display: flex;
  align-items: center;
}

.headshot img{
  width: 100%;
  background-color: #d4cbb1;
  aspect-ratio: 1 / 1;
  border-radius: 100%;
  object-fit: cover;
}

.hoster-info{
  display: flex;
  flex-direction: column;
  grid-column: 3/ span 2;
  grid-row: 2 / span 2;
  align-items: center;
  text-align: center;
  justify-content: top;
  margin-top: 25px;
}

.hoster-account{
  align-items: center;
}

.hoster-name,
.account-number{
  line-height: 1.8;
  width: 100%;
  margin: 0;
}

.hoster-name{
  font-size: 30px;
  max-width: 175px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-number{
  font-size: 18px;
  padding-bottom: 40px;
}

.follow-btn{
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
}

.follow-btn:hover{
  background-color: var(--color-primary-orange);
  color: white;
}

.hoster-message{
  grid-column: 6 / span 4; grid-row: 2;
  max-width: 451px;
  width: 100%;
  display: flex;
  align-items: center;
  text-align: center;
  margin-top: 10px;
}

.hoster-message>p{
  background-color: #fff;
  border-radius: 10px;
  padding: 10px;
  width: 100%;
  font-size: 18px;
}

.trigle{
  width: 14px;
  height: 14px;
  clip-path: polygon(100% 0, 0 50%, 100% 100%);
  background-color: #fff;
}

.badge{
  display: block;
  text-align: center;
  width: 80px;
  height: 80px;
}

.badge-title{
  padding-top: 50px;
}

.badge-card-1{
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
}

.badge-img{
  width: 100%;
  aspect-ratio: 1 / 1; 
  object-fit: cover; 
}

</style>