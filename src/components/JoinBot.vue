<template>
  <div :class="[
  'fixed z-50 flex flex-row-reverse items-end gap-2 transition-all duration-300',
  isOverlappingFooter
    ? 'md:bottom-[144px] max-md:bottom-52 right-4'
    : 'md:bottom-8 max-md:bottom-8 right-4'
]">

    <button @click="toggleChat" 
    :class="[
      'glow-button rounded-full shadow-lg hover:scale-110 transition-all duration-300 overflow-hidden p-0 border-none bg-transparent cursor-pointer',
      // 桌面版
      'w-20 h-20',
      // 手機版
      'max-md:w-16 max-md:h-16'
    ]">
      <img src="/JoinBot.png" alt="JoinBot Icon" class="object-contain w-full h-full rounded-full bg-transparent" />
    </button>

    <div v-if="showGreetingBubble" :class="[
      'animate-pop-in chat chat-end relative',
      'bottom-8 max-md:bottom-6'
    ]">
      <div :class="[
        'chat-bubble bg-var[(--color-icon-secondary)] text-gray-800',
        'text-sm max-md:text-xs',
        'max-md:max-w-32'
      ]">我可以推薦你酒吧唷！</div>
    </div>

    <div v-if="visible" :class="[
      'chat-container relative mt-2 p-5 rounded-2xl backdrop-blur-sm border-2 border-transparent bg-gradient-to-br from-white/95 to-slate-50/95 shadow-[0_8px_32px_rgba(0,0,0,0.12),0_0_0_1px_rgba(255,255,255,0.5),inset_0_1px_0_rgba(255,255,255,0.8)] drop-shadow-[0_0_20px_rgba(139,255,180,0.2)]',
      // 桌面版
      'w-80',
      // 手機版
      'max-md:w-auto max-md:max-w-[90vw] max-md:p-3',
      // 手機版避免超出螢幕
      'max-md:fixed max-md:bottom- max-md:right-1/2 max-md:translate-x-1/2'
    ]">

      <div class="flex justify-end gap-2 mb-4">
        <button
          :class="[
            'rounded-full border-none flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 hover:rotate-90 shadow-md hover:shadow-lg',
            'w-8 h-8 max-md:w-7 max-md:h-7'
          ]"
          style="background: linear-gradient(135deg, var(--color-secondary-green) 0%, #7dd3fc 100%)"
          @click="closeAndClear">
          <i :class="[
            'fa-solid fa-xmark text-white',
            'text-xl max-md:text-lg'
          ]"></i>
        </button>
      </div>  
      
      <h3 :class="[
        'font-bold mb-4 text-center text-gray-800 leading-snug',
        'text-lg max-md:text-base'
      ]">
        你的 JoinBot <br class="hidden max-md:block" />
        智慧酒吧推薦小幫手
      </h3>

      <!-- 回應區域 -->
      <div
        :class="[
          'whitespace-pre-wrap mb-4 p-3 rounded-lg leading-relaxed overflow-y-auto pr-1',
          'text-sm max-md:text-[13px]',
          'max-md:max-h-40'
        ]"
        style="max-height: 240px; background: linear-gradient(135deg, rgba(139, 255, 180, 0.1) 0%, rgba(255, 204, 153, 0.1) 100%); border: 1px solid rgba(139, 255, 180, 0.3);"
        v-if="response"
        v-html="response">
      </div>
      
      <!-- 輸入區塊 -->
      <div class="mb-4">
        <input
          @input="clearInputError"
          v-model="userMessage"
          type="text"
          :placeholder="isMobile ? '想去什麼酒吧？' : '你今天想去什麼類型的酒吧呀？'"
          :class="[
            'chat-input w-full p-3 rounded-xl border-2 border-transparent outline-none transition-all duration-300 shadow-sm focus:shadow-lg focus:-translate-y-0.5',
            'text-sm max-md:text-xs max-md:p-2',
            inputError ? 'placeholder-red-400' : ''
          ]"
          style="background: linear-gradient(white, white) padding-box, linear-gradient(135deg, rgba(139, 255, 180, 0.5) 0%, rgba(255, 204, 153, 0.5) 100%) border-box;"
          :style="inputError ? 'background: linear-gradient(white, white) padding-box, linear-gradient(135deg, #ef4444 0%, #f87171 100%) border-box; color: #dc2626;' : ''"
        />
        <p v-if="inputError" :class="[
          'text-red-600 mt-2 mb-2 animate-pulse',
          'text-xs max-md:text-[10px]'
        ]">{{ errorMessage }}</p>
      </div>

      <!-- 按鈕區域 -->
      <div class="flex justify-end gap-2">
        <button 
          @click="askJoinBot" 
          :class="[
            'font-medium rounded-xl px-5 py-3 mt-2 border-none cursor-pointer transition-all duration-300 relative overflow-hidden text-gray-800 shadow-md hover:shadow-xl hover:-translate-y-0.5 hover:scale-105 active:translate-y-0 active:scale-95 before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent before:-translate-x-full before:transition-transform before:duration-500 hover:before:translate-x-full',
            'max-md:px-3 max-md:py-2 max-md:text-xs max-md:mt-1'
          ]"
          style="background: linear-gradient(135deg, var(--color-secondary-green) 0%, #d8dbaf 50%, var(--color-primary-orange) 100%)">
          {{ isMobile ? '推薦酒吧？' : '有推薦的酒吧嗎？' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import axios from 'axios'

const visible = ref(false)
const response = ref('')
const showGreetingBubble = ref(true)
const userMessage = ref('')
const inputError = ref(false)
const errorMessage = ref('')
const isOverlappingFooter = ref(false)

// 檢測是否為手機版
const isMobile = computed(() => {
  if (typeof window !== 'undefined') {
    return window.innerWidth < 768
  }
  return false
})

function toggleChat() {
  visible.value = !visible.value
  showGreetingBubble.value = false
  inputError.value = false
  errorMessage.value = ''
}

function closeAndClear() {
  visible.value = false
  showGreetingBubble.value = false
  inputError.value = false
  errorMessage.value = ''
  // 清除搜尋紀錄
  response.value = ''
  userMessage.value = ''
}

function clearInputError() {
  if (inputError.value) {
    inputError.value = false
    errorMessage.value = ''
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

async function askJoinBot() {
  if (!userMessage.value.trim()) {
    inputError.value = true
    errorMessage.value = isMobile.value ? '請輸入條件！' : '請先輸入你想要的推薦條件唷！'
    return
  }

  response.value = '我來想想唷...'
  try {
    const res = await axios.post(`${API_BASE_URL}/api/barAi/recommendAI`, {
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

// 等 DOM 完整後再觀察 footer，避免干擾地圖載入
  nextTick(() => {
    const footer = document.querySelector('footer')
    if (footer) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          isOverlappingFooter.value = entry.isIntersecting
        },
        {
          root: null,
          threshold: 0.1
        }
      )
      observer.observe(footer)

      onUnmounted(() => {
        observer.disconnect()
      })
    }
  })
})
</script>

<style scoped>
/* JoinBot 按鈕發光效果 */
.glow-button {
  filter: drop-shadow(0 0 15px rgba(139, 255, 180, 0.5));
}

.glow-button:hover {
  filter: drop-shadow(0 0 25px rgba(139, 255, 180, 0.8));
}

.chat-container::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border-radius: 18px;
  z-index: -1;
  background: linear-gradient(135deg, 
    rgba(139, 255, 180, 0.6) 0%,
    rgba(255, 204, 153, 0.6) 50%,
    rgba(139, 255, 180, 0.6) 100%);
  animation: borderGlow 3s ease-in-out infinite alternate;
}

@keyframes borderGlow {
  0% { opacity: 0.6; }
  100% { opacity: 1; }
}

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
  color: #2d956b;
  text-decoration: underline;
  font-weight: 500;
  transition: color 0.2s ease;
}
:deep(a:hover) {
  color: #2d956b;
  text-decoration: none;
}

:deep(strong) {
  font-weight: 700;
  color: #000000;
}

/* 手機版特殊樣式 */
@media (max-width: 767px) {
  .chat-container {
    max-height: calc(100vh - 8rem);
    -webkit-overflow-scrolling: touch;
  }

  .chat-bubble {
    white-space: normal;
    word-wrap: break-word;
  }
}
</style>