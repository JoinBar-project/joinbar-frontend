<template>
  <div class="fixed bottom-6 right-6 z-50 flex flex-row-reverse items-end gap-2">

    

    <button @click="toggleChat" 
    class="w-20 h-20 rounded-full shadow-lg hover:scale-110 transition overflow-hidden p-0 border-none bg-transparent">
      <img src="/JoinBot.png" alt="JoinBot Icon" class="w-full h-full object-contain" />
    </button>

    <div v-if="showGreetingBubble" class="chat chat-end relative bottom-8">
      <div class="chat-bubble text-sm bg-var[(--color-icon-secondary)] text-gray-800">我可以推薦你酒吧唷！</div>
    </div>

    <div v-if="visible" class="bg-white border p-4 rounded-xl shadow-lg w-80 mt-2">
      <h3 class="font-bold text-lg mb-2">JoinBot 酒吧小幫手</h3>
      
      <div class="text-sm whitespace-pre-wrap mb-2" v-if="response">
        {{ response }}
      </div>

      <div class="flex gap-2">
        <button @click="askForBars" class="bg-wine-600 text-white rounded px-3 py-1 hover:bg-wine-700">
          有推薦的酒吧嗎？
        </button>
        <button @click="toggleChat" class="text-gray-500 text-sm">關閉</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { onMounted } from 'vue'

const visible = ref(false)
const response = ref('')
const showGreetingBubble = ref(true)

function toggleChat() {
  visible.value = !visible.value
  showGreetingBubble.value = false
}

async function askForBars() {
  response.value = '正在查詢推薦中...'
  try {
    const res = await axios.get('/api/barAi/recommend')
    response.value = res.data.result
  } catch (err) {
    response.value = '取得推薦失敗，請稍後再試 🥲'
  }
}

onMounted(() => {
  setTimeout(() => {
    showGreetingBubble.value = false
  }, 5000) 
})
</script>

<style scoped>
.bg-wine-600 {
  background-color: #7b2c33;
}
.bg-wine-700 {
  background-color: #631f25;
}
</style>
