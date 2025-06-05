<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router'
import dayjs from 'dayjs';
import axios from 'axios'
import 'dayjs/locale/zh-tw'
dayjs.locale('zh-tw')

const isJoin = ref(false)
const showModal = ref(false)
const event = ref(null)
const now = ref(dayjs())
const route = useRoute()
const eventId = route.params.id
const notFound = ref(false)
const isLoading = ref(true)
const errorMsg = ref('')


onMounted( async() => {
  try{
      const res = await axios.get(`/event/${eventId}`)
      event.value = res.data
      console.log(event.value)
  }catch(err){
    if( err.response && err.response.status == 404){
      notFound.value = true
      
    }else{
      errorMsg.value = '取得活動資料失敗'
      console.error('取得活動資料失敗', err)
    }
  }finally{
    isLoading.value = false
    }
})

const isOver24hr = computed(() => {
  if( !event.value || !event.value.startDate ) return false
  return dayjs(event.value.startDate).diff(now.value, 'hour') > 24
})

const formattedEventTime = computed(() =>{
  if (!event.value) return ''
  const start = dayjs(event.value.startDate).format('YYYY.MM.DD HH:mm (ddd)')
  const end = dayjs(event.value.endDate).format('YYYY.MM.DD HH:mm (ddd)')
  return `${start} ~ ${end}`
})

function toggleJoin(){
  isJoin.value = !isJoin.value
  console.log('現在狀態是：', isJoin.value)
}

function openCancelModal(){
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

function handleConfirmCancel(){
  isJoin.value = false
  showModal.value = false
}

</script>

<template>
  <div>
    <p v-if="isLoading">載入中，請稍後...</p>
    <p v-else-if="notFound">找不到活動</p>
    <p v-else-if="errorMsg">{{ errorMsg }}</p>
    <div v-else>
      <div :class="['modal', { 'modal-open': showModal }]">
        <div class="modal-box">
          <h3 class="text-lg font-bold">確認取消報名</h3>
          <p class="py-4">
            您確定要取消這次報名嗎？ <br/>
            <span>取消後如人數額滿或是活動開始前24小時內都將無法報名</span>， <br/>
            請再次確認您的選擇。
          </p>
          <div class="modal-action">
            <button class="btn" @click="closeModal">放棄取消</button>
            <button class="btn" @click="handleConfirmCancel">確認取消</button>
          
          </div>
        </div>
      </div>
    
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
                  <h3 class="event-title">{{ event.name }}
                  </h3>
                  <div class="event-content-info">
                    <i class="fa-solid fa-calendar"></i>
                    <p v-if="formattedEventTime">活動時間：{{ formattedEventTime }}</p>
                  </div>
                  <div class="event-content-info">
                    <i class="fa-solid fa-wine-glass"></i>
                  
                    <p>店名：{{ event.barName}}</p>
                  </div>
                  <div class="event-content-info">
                    <i class="fa-solid fa-location-dot"></i>
                    <p>地址：{{ event.location }}</p>
                  </div>
                  <div class="event-content-info">
                    <i class="fa-solid fa-user"></i>
                    <p>目前報名人數： <span>12</span> ｜ 報名人數上限：<span>{{ event.maxPeople || '無報名人數限制' }}</span></p>
                  </div>
                </div>
                <button @click="toggleJoin()" :disabled = "isJoin" :class="{ 'opacity-50 cursor-not-allowed': isJoin }" type="button" class="event-btn event-btn-free" >{{ isJoin ? '已報名' : '參加活動' }}</button>
                <button v-if="isJoin" @click="openCancelModal()" :disabled="!isOver24hr" :class="['event-btn event-btn-free',    isOver24hr ? 'cursor-pointer' : 'cursor-not-allowed opacity-50']"  type="button" class="event-btn event-btn-free" >取消報名</button>
              
              </div>
            </div>
          </div>
        </div>
    </div>  
  </div>
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
  min-width: 1170px;
  width: 100%;
  background-color: #f1f1f1;
  padding-bottom: 30px;
  margin: 0 auto;
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  position: relative;

}

.apply-tag{
  background-color: var(--color-primary-red);
  color: #f1f1f1;
  padding: 20px 80px;
  font-size: 28px;
  position: absolute;
  top: 0;
  right: 80px;

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
  margin-top: 10px;
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
  padding: 20px 70px 40px 500px;
}

.event-content-info{
  display: flex;
  align-items: top;
  padding: 1px 0;
}

.event-content-info p{
  font-size: 20px;
  line-height: 2;
  margin: 0;
}

.fa-solid{
  padding: 0 30px 0 0;
  margin-top: 13px;
}

.event-title{
  font-size: 28px;
  font-weight: bold;
  margin-top: 20px;
  margin-bottom: 20px;
}

.event-btn{
  margin-right: 30px;
  margin-top: 30px;
  border-radius: 20px;
  border: 0 ;
  font-size: 24px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
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
