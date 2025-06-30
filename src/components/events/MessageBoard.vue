<script setup>
import { ref, nextTick, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { getMessage, createMessage } from '@/api/message';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/zh-tw';
import 'emoji-picker-element';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('zh-tw');

const tz = 'Asia/Taipei';
const messageContent = ref('');
const showEmojiModal = ref(false);
const textareaRef = ref(null);
const cursorPos = ref(0);
const route = useRoute();
const eventId = route.params.id;
const messageboard = ref([]);
const errorMessage = ref('');
const defaultAvatarUrl = '/default-user-avatar.png';

onMounted(async () => {
  try {
    const data = await getMessage({ id: eventId });
    messageboard.value = data.map(msg => ({
      headshot: msg.userAvatarUrl || defaultAvatarUrl,
      user: msg.userNickname,
      messageContent: msg.content,
      messageTime: dayjs(msg.createdAt).tz(tz).format('YYYY.MM.DD HH:mm')
    }));
  } catch (err) {
    console.error('載入留言失敗', err);
  }
});

async function submitMessage() {
  const content = messageContent.value.trim();

  if (content === '') {
    errorMessage.value = '留言內容不可為空';
    return;
  }

  if (content.length > 200) {
    errorMessage.value = '留言長度不得超過 200 字';
    return;
  }

  try {
    const data = await createMessage({ id: eventId }, content);

    if (data?.error) {
      errorMessage.value = data.error;
      return;
    }

    messageContent.value = '';
    errorMessage.value = '';
    showEmojiModal.value = false;

    const result = await getMessage({ id: eventId });
    messageboard.value = result.map(msg => ({
      headshot: msg.userAvatarUrl || defaultAvatarUrl,
      user: msg.userNickname,
      messageContent: msg.content,
      messageTime: dayjs(msg.createdAt).tz(tz).format('YYYY.MM.DD HH:mm')
    }));
  } catch (err) {
    console.error('留言送出失敗', err);
    errorMessage.value = '留言送出失敗，請稍後再試';
  }
}

function handleEmojiModal() {
  showEmojiModal.value = !showEmojiModal.value;
}

function updateCursorPosition() {
  const textarea = textareaRef.value;
  if (textarea) {
    cursorPos.value = textarea.selectionStart;
  }
}

function handleEmojiSelect(event) {
  const emoji = event.detail.unicode;
  const textarea = textareaRef.value;
  const pos = cursorPos.value;

  const before = messageContent.value.slice(0, pos);
  const after = messageContent.value.slice(pos);
  messageContent.value = before + emoji + after;

  nextTick(() => {
    const newPos = pos + emoji.length;
    cursorPos.value = newPos;
    textarea.setSelectionRange(newPos, newPos);
    textarea.focus();
  });
}

function hideSearchRow() {
  const picker = document.querySelector('emoji-picker');
  const shadow = picker?.shadowRoot;
  const searchRow = shadow?.querySelector('.search-row');
  if (searchRow) {
    searchRow.style.display = 'none';
  }
}

onMounted(() => {
  watch(showEmojiModal, (val) => {
    if (val) {
      nextTick(() => {
        hideSearchRow();
      });
    }
  });
});
</script>

<template>
  <div class="event-message-section">
    <div class="event-message-bg">
      <div class="message-board-title">BarTalks 留言板</div>
      <div class="message-board">
        <div v-for="(message, index) in messageboard" :key="index" class="message-content">
          <div class="headshot">
            <img :src="message.headshot" @error="e => e.target.src = defaultAvatarUrl" alt="大頭照" />
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
          ></textarea>
          <p v-if="errorMessage" class="text-red-700 mt-2">※ {{ errorMessage }}</p>
          <div class="message-tool">
            <i @click="handleEmojiModal" class="fa-regular fa-face-smile"></i>
            <emoji-picker 
              v-if="showEmojiModal" 
              @emoji-click="handleEmojiSelect" 
              class="emoji emoji-picker"
            ></emoji-picker>
            <button @click="submitMessage" class="message-btn" type="button">送出</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.event-message-section {
  max-width: 100vw;
  padding-top: 2%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.event-message-bg {
  max-width: 1200px;
  min-width: 1000px;
  width: 100%;
  background-color: #f1f1f1;
  margin: 0 auto;
  border-radius: 20px;
  padding-bottom: 60px;
}

.message-board {
  max-width: 1036px;
  width: 100%;
  margin: 0 auto;
  background-color: #fff;
  border-radius: 20px;
  padding: 40px 10px;
}

.message-board-title {
  font-size: 30px;
  text-align: center;
  padding: 40px 0;
}

.message-area {
  background-color: #f1f1f1;
  width: 80%;
  border-radius: 20px;
  margin: 0 auto;
  padding: 20px 30px 15px 30px;
  margin-top: 20px;
}

.textarea {
  width: 80%;
  background-color: #ffffff00;
  border: 0 solid;
  padding: 10px;
  height: 100%;
}

.message-content {
  display: flex;
  align-items: top;
  justify-content: center;
}

.headshot {
  width: 6%;
  padding: 0 20px 0 0;
}

.headshot > img {
  aspect-ratio: 1 / 1;
  object-fit: cover;
  width: 100%;
  border-radius: 100%;
}

.user {
  font-weight: bold;
  margin: 0;
}

.message {
  width: 78%;
  padding: 0 20px 20px 20px;
  line-height: 2;
}

.message-date {
  color: #979595;
  font-size: 12px;
  margin-bottom: 30px;
}

.message-btn {
  border-radius: 6px;
  background-color: var(--color-secondary-green);
  border: 0 solid;
  color: #fff;
  padding: 5px 10px;
  cursor: pointer;
}

.message-btn:hover {
  background-color: var(--color-primary-orange);
}

.fa-regular {
  cursor: pointer;
  padding: 20px 20px 20px 0;
  font-size: 18px;
}

.fa-regular:hover {
  color: var(--color-primary-orange);
}

.message-tool {
  display: flex;
  position: relative;
  justify-content: end;
  align-items: center;
}

.emoji {
  position: absolute;
  z-index: 10;
  right: -240px;
  top: -200px;
  min-width: 320px;
  max-height: 200px;
}
</style>
