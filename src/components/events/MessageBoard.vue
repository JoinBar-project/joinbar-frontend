<script setup>
import { ref } from 'vue';

const messageContent = ref('')


function submitMessage(){
  if( messageContent.value.trim() != ''){
    messageContent.value = ''
  }
} 


</script>

<template>
  <div class="event-message-section">
    <div class="event-message-bg">
      <div class="message-board-title">BarTalks 留言板</div>
      <div class="message-board">
        <div class="message-content">
          <div class="headshot">
            <img src="@/components/events/picture/大頭照1.jpg" alt="大頭照">
          </div>
          <div class="message">
            <p class="user">新店裕隆成</p>
            <p>這裡看起來很讚!!這裡看起來很讚!!這裡看起來很讚!!這裡看起來很讚!!這裡看起來很讚!!這裡看起來很讚!!這裡看起來很讚!!這裡看起來很讚!!這裡看起來很讚!!這裡看起來很讚!!這裡看起來很讚!!這裡看起來很讚!!這裡看起來很讚!!這裡看起來很讚!!</p>
            <p class="message-date">2025/06/01 20:54</p>
          </div>
        </div>
        <div class="message-content">
          <div class="headshot">
            <img src="@/components/events/picture/大頭照2.jpg" alt="大頭照">
          </div>
          <div class="message">
            <p class="user">台北蔡一零</p>
            <p>那天我要睡在路邊! 喝到爛醉~~</p>
            <p class="message-date">2025/06/01 20:54</p>
          </div>
        </div>
        <div class="message-area">
          <textarea v-model="messageContent" class="textarea" placeholder="來分享你的想法吧！">
          </textarea>
          <div class="messgae-tool">
            <i class="fa-regular fa-face-smile"></i>
            <button @click="submitMessage()" class="messgae-btn" type="button">送出</button>
          </div>
          <div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

.event-message-section{
  max-width: 100vw;
  padding-top: 2%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.event-message-bg{
  max-width: 1200px;
  min-width: 1000px;
  width: 100%;
  background-color: #f1f1f1;
  margin: 0 auto;
  border-radius: 20px;
  padding-bottom: 60px;
}

.message-board{
  max-width: 1036px;
  width: 100%;
  margin: 0 auto;
  background-color: #fff;
  border-radius: 20px;
  padding: 40px 10px;
}

.message-board-title{
  font-size: 30px;
  text-align: center;
  padding: 40px 0;
}

.message-area{
  background-color: #f1f1f1;
  width: 80%;
  border-radius: 20px;
  margin: 0 auto;
  padding: 20px 30px 15px 30px;
  margin-top: 20px;
}

.textarea{
  width: 80%;
  background-color: #ffffff00;
  border: 0 solid;
  padding: 10px;
  height: 100%;
}

.message-content{
  display: flex;
  align-items: top;
  justify-content: center;
}

.headshot{
  width: 6%;
  padding: 0 20px 0 0;
}

.headshot > img{
  aspect-ratio: 1 /1;
  object-fit: cover;
  width: 100%;
  border-radius: 100%;
}

.user{
  font-weight: bold;
  margin: 0;
}

.message{
  width: 78%;
  padding: 0 20px 20px 20px;
  line-height: 2;
}

.message-date{
  color: #979595;
  font-size: 12px;
  margin-bottom: 30px;
}

.messgae-btn{
  border-radius: 6px;
  background-color: var(--color-secondary-green);
  border: 0 solid;
  color: #fff;
  padding: 5px 10px;
  cursor: pointer;
}

.messgae-btn:hover{
  background-color: var(--color-primary-orange);
}

.fa-regular{
  cursor: pointer;
  padding: 20px 20px 20px 0;
  font-size: 18px;
}

.fa-regular:hover{
  color: var(--color-primary-orange);
}

.messgae-tool{
  display: flex;
  justify-content: space-between;
  align-items: center;
}

</style>