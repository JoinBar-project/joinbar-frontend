<script setup>
import { ref, onMounted, watch } from 'vue'
import { useEventStore } from '@/stores/event'
import Hashtag from './Hashtag.vue'

const emit = defineEmits(['update', 'delete'])
const props = defineProps({ eventId: String }) // 傳 id 進來

const eventStore = useEventStore()

const eventName = ref('')
const barName = ref('')
const eventLocation = ref('')
const eventStartDate = ref('')
const eventEndDate = ref('')
const eventImageUrl = ref('')
const eventPrice = ref('')
const eventPeople = ref('')
// const hostUser = ref('') 等會員系統建置完成
const eventHashtags = ref([])

// 等加入地圖元件：暫時自動填寫地點
watch(barName, (newVal) => {
  if (newVal) {
    eventLocation.value = '台北市中正區中正路100號'
  } else {
    eventLocation.value = ''
  }
})

function toDatetimeLocal(dtString) {
  if (!dtString) return '';
  // 直接 new Date 解析，再 format
  const d = new Date(dtString);
  const pad = n => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

onMounted(async () => {
  if (props.eventId) {
    await eventStore.fetchEvent(props.eventId)
    const data = eventStore.event
    if (data && data.stringModel) {
      eventName.value = data.stringModel.name || ''
      barName.value = data.stringModel.barName || ''
      eventLocation.value = data.stringModel.location || ''
      eventStartDate.value = toDatetimeLocal(data.stringModel.startDate)
      eventEndDate.value = toDatetimeLocal(data.stringModel.endDate)
      eventImageUrl.value = data.stringModel.imageUrl || ''
      eventPrice.value = data.stringModel.price || ''
      eventPeople.value = data.stringModel.maxPeople || ''
      // hostUser.value = data.stringModel.hostUser || ''
      eventHashtags.value = data.tagIds || []
    }
  }
})

function handleUpdate() {
  if (
    !eventName.value ||
    !barName.value ||
    !eventStartDate.value ||
    !eventEndDate.value ||
    !eventPrice.value ||
    !eventPeople.value
  ) {
    alert('請完整填寫所有欄位！')
    return
  }
  const payload = {
    name: eventName.value,
    barName: barName.value,
    location: eventLocation.value,
    startDate: eventStartDate.value,
    endDate: eventEndDate.value,
    maxPeople: Number(eventPeople.value),
    imageUrl: eventImageUrl.value,
    price: Number(eventPrice.value),
    hostUser: 1, // 與 FormCreate 一致，等會員系統
    tags: [...eventHashtags.value]
  }
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
            <label for="bar-name">酒吧名稱</label>
            <input type="text" id="bar-name" v-model="barName" placeholder="請輸入酒吧名稱" />
          </div>
          <div class="event-location">
            {{eventLocation}}
          </div>
          <div class="form-row">
            <label for="event-start-date">開始日期</label>
            <input type="datetime-local" id="event-start-date" v-model="eventStartDate" />
          </div>
          <div class="form-row">
            <label for="event-end-date">結束日期</label>
            <input type="datetime-local" id="event-end-date" v-model="eventEndDate" />
          </div>
          <div class="form-row">
            <label for="event-price">價格</label>
            <input type="number" id="event-price" v-model="eventPrice" placeholder="請輸入價格" />
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

.event-location {
  font-size: 16px;
  margin-left: 110px;
  color:var(--color-primary-red)
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
