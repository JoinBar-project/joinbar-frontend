<script setup>
import { ref, nextTick, onMounted, watch } from 'vue';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/zh-tw'
import 'emoji-picker-element';

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.locale('zh-tw')

const tz = 'Asia/Taipei'
const messageContent = ref('')
const showEmojiModal = ref(false)
const textareaRef = ref(null)
const cursorPos = ref(0)

const messages = ref([
  {
    headshot : new URL('@/components/events/picture/大頭照1.jpg', import.meta.url).href,
    user : 'Bella',
    messageContent : '這裡看起來很讚！我要來～',
    messageTime : dayjs().tz(tz).format('YYYY.MM.DD HH:mm')
  },
  {
    headshot : new URL('@/components/events/picture/大頭照1.jpg', import.meta.url).href,
    user : 'Mella',
    messageContent : '今天要介紹的酒吧是位於林森北路的Bar千華,主要是以經典調酒為主，只要能說得出酒名,基本上一定能做得出來,這次位我服務的調酒師叫Shawn, 雖然年紀不大,卻有個老派的靈魂對於酒類知識也十分精通,不管是經典調酒背後的典故,或各種烈酒的知識,都能信手拈來,調酒的風格屬於溫柔舒服的類型,但不代表酒下得少,只是運用調酒手法,把酒感處理得很漂亮,不知不覺就會讓人喝得比預期來得多。對於各式經典調酒,也有屬於自己的獨到見解,接下來就來看我為大家帶來的三杯經典吧!',
    messageTime : dayjs().tz(tz).format('YYYY.MM.DD HH:mm')
  },
  {
    headshot : new URL('@/components/events/picture/大頭照1.jpg', import.meta.url).href,
    user : 'I LOVE MASO',
    messageContent : '今天表演者共8位，一開始竟然是澳洲介紹vcr，猛男大外宣耶，舞蹈部分舞跳的非常不齊，有幾位很划水（但划水的長得帥所以沒關係），但也有幾位跳舞非常厲害，空翻樣樣來，舞蹈元素大概是牛仔、制服、戰士等，舞真的還好，重點在肉體!',
    messageTime : dayjs().tz(tz).format('YYYY.MM.DD HH:mm')
  },
])

function submitMessage(){
  if( messageContent.value.trim() != ''){
    messages.value.push({
      headshot: new URL('@/components/events/picture/大頭照2.jpg', import.meta.url).href,
      user: '天堂18曾',
      messageContent: messageContent.value,
      messageTime: dayjs().tz(tz).format('YYYY.MM.DD HH:mm')
    })
    messageContent.value = ''
  }
}

function handleEmojiModal(){
  showEmojiModal.value = !showEmojiModal.value
}

function updateCursorPosition() {
  const textarea = textareaRef.value
  if (textarea) {
    cursorPos.value = textarea.selectionStart
  }
}

function handleEmojiSelect(event) {
  const emoji = event.detail.unicode
  const textarea = textareaRef.value
  const pos = cursorPos.value

  const before = messageContent.value.slice(0, pos)
  const after = messageContent.value.slice(pos)
  messageContent.value = before + emoji + after

  nextTick(() => {
    const newPos = pos + emoji.length
    cursorPos.value = newPos
    textarea.setSelectionRange(newPos, newPos)
    textarea.focus()
  })
}

function hideSearchRow() {
  const picker = document.querySelector('emoji-picker')
  const shadow = picker?.shadowRoot
  const searchRow = shadow?.querySelector('.search-row')
  if (searchRow) {
    searchRow.style.display = 'none'
  }
}

onMounted(() => {
  watch(showEmojiModal, (val) => {
    if (val) {
      nextTick(() => {
        hideSearchRow()
      })
    }
  })
})

</script>

<template>
  <div class="event-message-section">
    <div class="event-message-bg">
      <div class="message-board-title">BarTalks 留言板</div>
      <div class="message-board">
        <div v-for="(message, index) in messages" :key="index" class="message-content">
          <div class="headshot">
            <img :src="message.headshot" alt="大頭照">
          </div>
          <div class="message">
            <p class="user">{{ message.user }}</p>
            <p>{{ message.messageContent }}</p>
            <p class="message-date">{{ message.messageTime }}</p>
          </div>
        </div>
        <div class="message-area">
          <textarea 
            ref="textareaRef"
            v-model="messageContent"
            @click="updateCursorPosition"
            @keyup="updateCursorPosition"
            @input="updateCursorPosition"
            class="textarea" 
            placeholder="來分享你的想法吧！"
          >
          </textarea>
          <div class="messgae-tool">
            <i @click="handleEmojiModal" class="fa-regular fa-face-smile"></i>
            <emoji-picker 
              v-if="showEmojiModal" 
              @emoji-click="handleEmojiSelect" 
              class="emoji emoji-picker"
            ></emoji-picker>
            <button @click="submitMessage" class="messgae-btn" type="button">送出</button>
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
  position: relative;
  justify-content: end;
  align-items: center;
}

.emoji{
  position: absolute;
  z-index: 10;
  right: -240px;
  top: -200px;
  min-width: 320px;
  max-height: 200px;
}

</style>