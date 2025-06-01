<script setup>
import { ref } from 'vue'
import { defineEmits } from 'vue'
import Hashtag from './Hashtag.vue'
const emit = defineEmits(['update', 'delete'])

const eventName = ref('')
const eventLocation = ref('')
const eventDate = ref('')
const eventTime = ref('')
const eventPeople = ref('')
const eventHashtags = ref([])

function handleUpdate() {
  emit('update')
}
function handleDelete() {
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
            <label for="event-date">活動日期</label>
            <input type="date" id="event-date" v-model="eventDate"/>
          </div>
          <div class="form-row">
            <label for="event-time">活動時間</label>
            <input type="time" id="event-time" v-model="eventTime"/>
          </div>
          <div class="form-row">
            <label for="event-time">參加人數</label>
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
  height: 55px;
  text-align: center;
  align-items: center;
  margin: 0 auto;
  font-size: 18px;
  padding-top: 10px;
  margin-bottom: -10px;
  border-radius: 10px;
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
  height: 45px;
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
