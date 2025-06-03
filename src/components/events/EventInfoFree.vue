<script setup>
import { ref } from 'vue';
import MessageBoard from './MessageBoard.vue';

const isJoin = ref(false)

function toggleJoin(){
  isJoin.value = !isJoin.value
  console.log('現在狀態是：', isJoin.value)
}

</script>

<template>
  <div class="event-information-section">
    <div class="event-information-card">
      <div class="event-img">
        <img src="@/components/events/picture/酒吧示意圖.jpg" alt="酒吧示意圖"> 
      </div>
      <div class="event-content-box">
        <div class="event-map">
        </div>
        <div class="event-content">
          <div class="event-tags">
            <div>免費活動</div>
            <div>下班來喝</div>
          </div>
          <div>
            <h3 class="event-title">周末CHILL調酒Day，藍調爵士抒情夜
              入場免費招待一杯SHOT，歡迎加入!
            </h3>
            <div class="event-content-info">
              <i class="fa-solid fa-calendar"></i>
              <p>2025.01.01(一) 21:00 ~ 2025.02.28(五) 23:59</p>
            </div>
            <div class="event-content-info">
              <i class="fa-solid fa-location-dot"></i>
              <p>BAR AMIGO｜新北市板橋區中正路100號</p>
            </div>
            <div class="event-content-info">
              <i class="fa-solid fa-user"></i>
              <p>目前報名人數： <span>12</span> / <span>20</span></p>
            </div>
          </div>
          <button @click="toggleJoin()" type="button" class="event-btn event-btn-free" >{{ isJoin ? '取消參加' : '免費參加' }}</button>
        </div>
      </div>
    </div>
  </div>
  <MessageBoard v-if="isJoin" />
  

</template>

<style scoped>

.event-information-section{
  max-width: 100vw;
  padding-top: 2%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.event-information-card{
  max-width: 1200px;
  min-width: 1000px;
  width: 100%;
  background-color: #f1f1f1;
  padding-bottom: 30px;
  margin: 0 auto;
  position: relative;
  border-radius: 20px;
  overflow: hidden
}

.event-img > img{
  width: 100%;
  aspect-ratio: 3.5 / 1;
  object-fit: cover;
}

.event-map{
  position: absolute;
  bottom: 70px;
  left: 80px;
  z-index: 2;
  background-color: gray;
  border-radius: 10px;
  max-width: 325px;
  width: 325px;
  height: 500px;
  margin: 0 auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  cursor: pointer;
}

.event-tags{
  display: flex;
}

.event-tags div{
  background-color: var(--color-black);
  padding: 8px 20px; 
  text-align: center;
  margin-right: 10px; 
  border-radius: 20px; 
  color: white;
}

.event-content-box{
  display: flex;
}

.event-content{
  padding: 40px 70px 40px 500px;
}

.event-content-info{
  display: flex;
  align-items: center;
  padding: 1px 0;
}

.event-content-info p{
  font-size: 20px;
  line-height: 2.5;
  margin: 0;
}

.fa-solid{
  padding: 0 30px 0 0;
}

.event-title{
  font-size: 28px;
  font-weight: bold;
}

.event-btn{
  margin-right: 30px;
  margin-top: 30px;
  border-radius: 20px;
  border: 0 ;
  font-size: 24px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  cursor: pointer;
}

.event-btn-free{
  background-color: white;
  padding: 8px 45px 10px 45px;
}

.event-btn-free:hover{
  background-color: var(--color-primary-orange);
  color: white;
}

</style>
