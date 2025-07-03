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
  <div class="flex items-center justify-center max-w-full px-4 md:px-0">
    <div class="w-full max-w-7xl md:max-w-[1200px] md:min-w-[1000px] bg-gray-100 mx-auto rounded-xl md:rounded-2xl pb-10 md:pb-15">
      
      <!-- 標題 -->
      <div class="py-6 text-xl font-medium text-center md:text-3xl md:py-10">
        BarTalks 留言板
      </div>
      
      <!-- 留言板主體 -->
      <div class="w-full max-w-[1036px] mx-auto bg-white rounded-xl md:rounded-2xl p-4 md:p-10">
        
        <!-- 留言列表 -->
        <div class="space-y-4 md:space-y-6">
          <div v-for="(message, index) in messageboard" :key="index" class="message-item">
            <!-- 桌面版佈局 -->
            <div class="items-start hidden md:flex">
              <div class="flex-shrink-0 w-12 mr-4 md:w-16 md:mr-5">
                <img 
                  :src="message.headshot" 
                  @error="e => e.target.src = defaultAvatarUrl" 
                  alt="大頭照" 
                  class="object-cover w-full rounded-full aspect-square"
                />
              </div>
              <div class="flex-1 min-w-0">
                <p class="mb-1 text-base font-bold text-gray-900 md:text-lg">{{ message.user }}</p>
                <p class="mb-2 text-sm leading-relaxed text-gray-800 md:text-base">{{ message.messageContent }}</p>
                <p class="mb-6 text-xs text-gray-500">{{ message.messageTime }}</p>
              </div>
            </div>
            
            <!-- 手機版佈局 -->
            <div class="block md:hidden">
              <div class="flex items-start space-x-3">
                <div class="flex-shrink-0 w-10 h-10">
                  <img 
                    :src="message.headshot" 
                    @error="e => e.target.src = defaultAvatarUrl" 
                    alt="大頭照" 
                    class="object-cover w-full h-full rounded-full"
                  />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="mb-1 text-sm font-bold text-gray-900">{{ message.user }}</p>
                  <p class="mb-2 text-sm leading-relaxed text-gray-800">{{ message.messageContent }}</p>
                  <p class="mb-4 text-xs text-gray-500">{{ message.messageTime }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 留言輸入區 -->
        <div class="w-full p-4 mx-auto mt-6 bg-gray-100 rounded-xl md:rounded-2xl md:p-6 md:mt-8 md:w-4/5">
          <div class="space-y-3 md:space-y-4">
            <!-- 文字輸入區 -->
            <div class="flex flex-col space-y-3 md:flex-row md:items-start md:space-y-0 md:space-x-4">
              <textarea 
                ref="textareaRef"
                v-model="messageContent"
                @click="updateCursorPosition"
                @keyup="updateCursorPosition"
                @input="updateCursorPosition"
                class="flex-1 bg-transparent border-0 p-3 md:p-4 text-sm md:text-base resize-none focus:outline-none placeholder-gray-500 min-h-[80px] md:min-h-[100px]" 
                placeholder="來分享你的想法吧！"
              ></textarea>
            </div>
            
            <!-- 錯誤訊息 -->
            <p v-if="errorMessage" class="text-sm text-red-700">※ {{ errorMessage }}</p>
            
            <!-- 工具列 -->
            <div class="relative flex items-center justify-between">
              <div class="relative">
                <i 
                  @click="handleEmojiModal" 
                  class="text-lg text-gray-600 transition-colors cursor-pointer fa-regular fa-face-smile md:text-xl hover:text-orange-500"
                ></i>
                <emoji-picker 
                  v-if="showEmojiModal" 
                  @emoji-click="handleEmojiSelect" 
                  class="absolute right-0 z-10 mb-2 emoji-picker bottom-full md:right-auto md:left-0"
                ></emoji-picker>
              </div>
              
              <button 
                @click="submitMessage" 
                class="px-4 py-2 text-sm font-medium text-white transition-colors duration-200 bg-green-600 border-0 rounded-lg cursor-pointer md:px-6 md:py-3 hover:bg-orange-500 md:text-base"
                type="button"
              >
                送出
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.emoji-picker {
  min-width: 280px;
  max-width: 320px;
  max-height: 200px;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

@media (max-width: 767px) {
  .emoji-picker {
    min-width: 260px;
    max-width: 280px;
    border-radius: 12px;
    right: -260px;
    top: 35px;
    transform: translateX(0);
    z-index: 2000;
  }
}

@media (max-width: 767px) {
  textarea {
    min-height: 80px;
  }
}

.message-item:not(:last-child) {
  border-bottom: 1px solid #f3f4f6;
  padding-bottom: 1rem;
}

@media (min-width: 768px) {
  .message-item:not(:last-child) {
    padding-bottom: 1.5rem;
  }
}

.message-item p {
  word-wrap: break-word;
  overflow-wrap: break-word;
}
</style>