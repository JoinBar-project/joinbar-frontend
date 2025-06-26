<template>
  <div class="fixed bottom-8 right-8 z-50 flex flex-row-reverse items-end gap-2">

    <button @click="toggleChat" 
    class="w-20 h-20 rounded-full shadow-lg hover:scale-110 transition overflow-hidden p-0 border-none bg-transparent">
      <img src="/JoinBot.png" alt="JoinBot Icon" class="w-full h-full object-contain" />
    </button>

    <div v-if="showGreetingBubble" class="animate-pop-in chat chat-end relative bottom-8">
      <div class="chat-bubble text-sm bg-var[(--color-icon-secondary)] text-gray-800">我可以推薦你酒吧唷！</div>
    </div>

    <div v-if="visible" class="bg-white border p-4 rounded-xl shadow-lg w-80 mt-2">
      
      <button
          class="top-4 right-4 z-10 bg-[var(--color-secondary-green)] backdrop-blur-sm border-0 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer transition-all hover:scale-110"
          @click="toggleChat">
          <i class="fa-solid fa-xmark text-white text-xl"></i>
        </button>

      <h3 class="font-bold text-lg mb-2">你的 JoinBot 智慧酒吧推薦小幫手</h3>
      
      <div class="text-sm whitespace-pre-wrap mb-2" v-if="response" v-html="response">
      </div>
      <input
        @input="clearInputError"
        v-model="userMessage"
        type="text"
        placeholder="你今天想去什麼類型的酒吧呀？"
        class="input input-bordered w-full text-sm" 
        :class="inputError ? 'border-red-500 text-red-600 placeholder-red-400' : ''"
      />
      <p v-if="inputError" class="text-red-500 text-xs mt-1 mb-2">{{ errorMessage }}</p>

        <div class="flex gap-2">
        <button 
          @click="askJoinBot" 
          class="bg-gradient-to-r from-[var(--color-secondary-green)] via-[#d8dbaf] to-[var(--color-primary-orange)] 
                  text-gray-700 font-medium rounded-lg px-4 py-2 mt-2
                  hover:shadow-md hover:scale-105 
                  active:scale-95 
                  transition-all duration-200 ease-in-out
                  ">
          有推薦的酒吧嗎？
        </button>
        
  </div>
</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const visible = ref(false)
const response = ref('')
const showGreetingBubble = ref(true)
const userMessage = ref('')
const inputError = ref(false)
const errorMessage = ref('')

function toggleChat() {
  visible.value = !visible.value
  showGreetingBubble.value = false
  inputError.value = false
  errorMessage.value = ''
}

function clearInputError() {
  if (inputError.value) {
    inputError.value = false
    errorMessage.value = ''
  }
}

async function askJoinBot() {
  if (!userMessage.value.trim()) {
    inputError.value = true
    errorMessage.value = '請先輸入你想要的推薦條件唷！'
    return
  }

  response.value = '我來想想唷...'
  try {
    const res = await axios.post('/api/barAi/recommendAI', {
      message: userMessage.value
    })
    response.value = res.data.result
    userMessage.value = ''
  } catch (err) {
    console.error('AI 錯誤：', err)
    response.value = '取得推薦失敗，請稍後再試 🥲'
  }
}

onMounted(() => {
  setTimeout(() => {
    showGreetingBubble.value = false
  }, 3000)
})
</script>


<style scoped>
@keyframes pop-in {
  0% {
    opacity: 0;
    transform: scale(0.5) translateY(20px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.animate-pop-in {
  animation: pop-in 0.4s ease-out forwards;
}

:deep(a) {
  color: #2563eb;
  text-decoration: underline;
  font-weight: 500;
}

:deep(a:hover) {
  color: #1d4ed8;
  text-decoration: none;
}

</style>
