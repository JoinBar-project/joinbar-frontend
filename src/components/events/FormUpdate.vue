<script setup>
import { ref, onMounted, defineEmits, defineProps } from 'vue'
import { useEventStore } from '@/stores/event'
import Hashtag from './Hashtag.vue'

const emit = defineEmits(['update', 'delete'])
const eventStore = useEventStore()
const props = defineProps({ eventId: String }) // 傳 id 進來

onMounted(async () => {
  if (props.eventId) {
    await eventStore.fetchEvent(props.eventId)
    const data = eventStore.event
    eventName.value = data.name || ''
    barName.value = data.barName || ''
    eventLocation.value = data.location || ''
    eventStartDate.value = data.startDate ? data.startDate.slice(0, 10) : ''
    eventEndDate.value = data.endDate ? data.endDate.slice(0, 10) : ''
    eventImageUrl.value = data.imageUrl || ''
    eventPrice.value = data.price || ''
    eventPeople.value = data.maxPeople || ''
    hostUser.value = data.hostUser || ''
    eventHashtags.value = data.tags || []
  }
})

function handleUpdate() {
  const payload = {
    name: eventName.value,
    barName: barName.value,
    location: eventLocation.value,
    startDate: eventStartDate.value,
    endDate: eventEndDate.value,
    maxPeople: Number(eventPeople.value),
    imageUrl: eventImageUrl.value,
    price: Number(eventPrice.value),
    hostUser: hostUser.value,
    tags: eventHashtags.value
  }
  console.log(payload)
  eventStore.updateEvent(props.eventId, payload)
  emit('update')
}

function handleDelete() {
  eventStore.deleteEvent(props.eventId)
  emit('delete')
}

function handleCancel() {
  emit('update')
}
</script>

<template>
  <section class="event-form" id="edit-event">
    <div class="form-header">編輯中</div>
    <div class="form-container">
      <div class="form-image-upload">
        <div class="event-image-placeholder">點擊更換活動圖</div>
      </div>
      <div class="form-layout">
        <div class="form-left">
          <div class="form-row">
            <label for="event-name">活動名稱</label>
            <input type="text" id="event-name" v-model="eventName" placeholder="請輸入活動名稱" />
          </div>
          <div class="form-row">
            <label for="event-location">活動地點</label>
            <input type="text" id="event-location" v-model="eventLocation" placeholder="請輸入活動地點" />
          </div>
          <div class="form-row">
            <label for="bar-name">酒吧名稱</label>
            <input type="text" id="bar-name" v-model="barName" placeholder="請輸入酒吧名稱" />
          </div>
          <div class="form-row">
            <label for="event-start-date">開始日期</label>
            <input type="date" id="event-start-date" v-model="eventStartDate" />
          </div>
          <div class="form-row">
            <label for="event-end-date">結束日期</label>
            <input type="date" id="event-end-date" v-model="eventEndDate" />
          </div>
          <div class="form-row">
            <label for="event-price">價格</label>
            <input type="number" id="event-price" v-model="eventPrice" placeholder="請輸入價格" />
          </div>
          <div class="form-row">
            <label for="host-user">主辦者</label>
            <input type="text" id="host-user" v-model="hostUser" placeholder="請輸入主辦者" />
          </div>
          <div class="form-row">
            <label for="event-people">參加人數</label>
            <input type="number" id="event-people" v-model="eventPeople" min="1" step="1" max="30"/>
          </div>
          <Hashtag v-model="eventHashtags" />
        </div>
        <div class="form-right"></div>
      </div>
      <div class="form-bottom">
        <button type="button" class="btn-delete" @click="handleDelete">刪除活動</button>
        <button type="button" class="btn-cancle" @click="handleCancel">取消修改</button>
        <button type="button" class="btn-confirm" @click="handleUpdate">完成發佈</button>
      </div>
    </div>
  </section>
</template>

<style scoped>

.event-form{
  z-index: 99;
}

.form-header{
  width: 140px;
  text-align: center;
  margin: 0 auto;
  font-size: 18px;
  padding: 6px;
  border-radius: 15px 15px 0 0;
  color: #fff;
  background-color: var(--color-primary-orange);
}

.form-container {
  margin: 0 auto;
  width: 700px;
  border-radius: 20px;
  background-color: #ccc;
}

.form-image-upload{
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 300px;
  font-size: 20px;
  color:#b1b1b1;
  border-radius: 20px 20px 0 0;
  background-color: #e6e6e6;
}

.form-layout{
  padding: 20px;
  display: grid;
  grid-template-columns: 1.5fr 1fr ; 
  align-items: center;
  gap: 20px;
}


.form-left {
  font-size: 20px;
}

.form-right {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  border-radius: 10px;
  background-color: var(--color-black);
}

.form-row {
  display: grid;
  grid-template-columns: 100px 1fr; 
  align-items: center;
  margin: 10px 0;
}

.form-row label {
  font-size: 20px;
  text-align: center;
}
.form-row input {
  height: 40px;
  padding: 0 10px;
  font-size: 18px;
  border: 3px solid #b9b9b9;
  border-radius: 15px;
  background-color: white;
}

.form-bottom{
  padding: 0 50px;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr ;
  padding-bottom: 20px;
}

.form-bottom button {
  display: block;
  margin: 0 auto;
  width: 180px;
  padding: 5px 0;
  font-size: 20px;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
}

.btn-delete{
  background-color: #b1b1b1;
}
.btn-cancle{
  background-color: var(--color-secondary-green);
}
.btn-confirm{
  background-color: var(--color-primary-red);
}

</style>
