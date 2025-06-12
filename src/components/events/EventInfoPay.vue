<script setup>
import { useEvent } from '@/composable/useEvent.js';
import { useCartStore } from '@/stores/cartStore';  
import { useRouter } from 'vue-router';              
import { toRef, computed } from 'vue';
import EventHoster from './EventHoster.vue';
import MessageBoard from './MessageBoard.vue';

const props = defineProps({
 event: Object,
 tags: Array,
}) 

const eventRef = toRef(props, 'event')
const cart = useCartStore() 
const router = useRouter()   

const {
 isJoin,
 joinedNum,
 toggleJoin,
 isOver24hr,
 showModal,
 formattedEventTime,
 openCancelModal,
 closeModal,
 handleConfirmCancel
} = useEvent(eventRef)

const isInCart = computed(() => cart.isInCart(props.event.id))

const addToCart = () => {
 try {
   const eventData = {
     id: props.event.id,
     name: props.event.name,
     price: props.event.price,
     imageUrl: props.event.imageUrl,
     barName: props.event.barName,
     location: props.event.location,
     startDate: props.event.startDate,
     endDate: props.event.endDate,
     maxPeople: props.event.maxPeople,
     hostUser: props.event.hostUser
   }
   
   cart.addItem(eventData)
   alert('已加入購物車！')
   
 } catch (error) {
   alert(error.message)
 }
}

const buyNow = () => {
 try {
   if (!isInCart.value) {
     const eventData = {
       id: props.event.id,
       name: props.event.name,
       price: props.event.price,
       imageUrl: props.event.imageUrl,
       barName: props.event.barName,
       location: props.event.location,
       startDate: props.event.startDate,
       endDate: props.event.endDate,
       maxPeople: props.event.maxPeople,
       hostUser: props.event.hostUser
     }
     cart.addItem(eventData)
   }
   
   router.push('/payment')
   
 } catch (error) {
   alert(error.message)
 }
}
</script>

<template>
 <div>
   <div :class="['modal', { 'modal-open': showModal }]">
     <div class="modal-box">
       <h3 class="text-lg font-bold">確認取消報名</h3>
       <p class="py-4">
         您確定要取消這次報名嗎？<br />
         <span>取消後如人數額滿或是活動開始前24小時內都將無法報名</span>，<br />
         請再次確認您的選擇。
       </p>
       <div class="modal-action">
         <button class="btn" @click="closeModal">放棄取消</button>
         <button class="btn" @click="handleConfirmCancel">確認取消</button>
       </div>
     </div>
   </div>

   <div class="event-information-card">
     <div class="event-img">
       <img src="@/components/events/picture/酒吧示意圖.jpg" alt="酒吧示意圖" />
     </div>

     <div class="event-content-box">
       <div class="event-map">
       </div>

       <div class="event-content">
         <div class="event-tags">
           <div v-for="tag in props.tags" :key="tag.id">{{ tag.name }}</div>
         </div>

         <div>
           <h3 class="event-title">
             {{ props.event.name }}
           </h3>

           <div v-if="formattedEventTime" class="event-content-info">
             <i class="fa-solid fa-calendar"></i>
             <p>活動時間：{{ formattedEventTime }}</p>
           </div>

           <div class="event-content-info">
             <i class="fa-solid fa-wine-glass"></i>
             <p>店名：{{ props.event.barName}}</p>
           </div>
           
           <div class="event-content-info">
             <i class="fa-solid fa-location-dot"></i>
             <p>地址：{{ props.event.location }}</p>
           </div>

           <div class="event-content-info">
             <i class="fa-solid fa-dollar-sign"></i>
             <p class="event-payment">費用：新台幣 <span>{{ props.event.price }}</span> 元</p>
           </div>

           <div class="event-content-info">
             <i class="fa-solid fa-user"></i>
             <p>目前報名人數： <span>{{ joinedNum }}</span> ｜ 報名人數上限：<span>{{ props.event.maxPeople || '無報名人數限制' }}</span></p>
           </div>
         </div>

         <button @click="addToCart" type="button" class="event-btn event-btn-cart">
           {{ isInCart ? '✓ 已在購物車' : '加入購物車' }}
         </button>
         <button @click="buyNow" type="button" class="event-btn event-btn-pay">
           立即付費參加
         </button>
         
       </div>
     </div>
   </div>

   <EventHoster />
   <MessageBoard v-if="isJoin"  />
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
 height: 550px;
 margin: 0 auto;
 box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
 cursor: pointer;
}

.event-tags{
 display: flex;
 margin-bottom: 20px;
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

.fa-calendar{
 padding-right: 26px;
}

.event-title{
 font-size: 28px;
 margin: 10px 0;
 font-weight: bold;
}

.event-payment,
.fa-dollar-sign{
 color: #860914;
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

.event-btn-pay{
 background-color: #860914;
 color: #ecd8d8;
 padding: 8px 16px 10px 16px;
}

.event-btn-pay:hover{
 background-color: #d4624e;
}

.event-btn-cart{
 background-color: white;
 padding: 8px 28px 10px 28px;
 cursor: pointer;
}

.event-btn-cart:hover{
 background-color: var(--color-primary-orange);
 color: white;
 padding: 8px 28px 10px 28px;
 cursor: pointer;
}
</style>