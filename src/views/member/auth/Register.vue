<template>
  <div class="max-w-md mx-auto mt-10 p-6 bg-[#f8ecec] rounded-xl shadow-xl text-[#f9ebd5]">
    
    <!-- Tabs -->
    <div class="flex border-b border-[#f3c4cc]">
      <router-link
        to="/login"
        class="flex-1 py-2 text-center font-semibold text-[#b0a89c] hover:text-[#860914] transition">
        會員登入
      </router-link>
      
      <button
        class="flex-1 py-2 text-center font-semibold border-b-3 border-[#aa666c] text-[#860914]">
        註冊
      </button>
    </div>

    <!-- 切換動畫 -->
    <transition name="slide-fade" mode="out-in">
      <div :key="step">
        <!-- Step 1: 註冊表單 -->
        <div v-if="step === 1" class="space-y-4 mt-6">
          <h2 class="text-xl font-semibold mb-4 text-[#860914]">建立帳號</h2>
          <div v-for="(field, index) in registerFields" :key="index" class="flex items-center border border-gray-300 rounded px-3 py-2">
            <i :class="field.icon" class="text-gray-400 mr-2"></i>
            <input :type="field.type" :placeholder="field.placeholder" v-model="form[field.model]"
              class="w-full outline-none text-[#860914] placeholder-[#860914]"
            />
          </div>

          <!-- 快速加入 -->
          <div class="text-center text-sm text-gray-300 my-4 flex items-center">
            <div class="flex-grow h-px bg-gray-400"></div>
            <span class="mx-2 text-[#860914]">或</span>
            <div class="flex-grow h-px bg-gray-400"></div>
          </div>
          <div class="flex space-x-2 justify-center">
            <button class="btn bg-white text-black border-[#e5e5e5] border-2 flex items-center px-4 py-2 rounded-lg hover:shadow-md transition">
              <img src="/google.svg" alt="Google" class="w-5 h-5 mr-2" /> register for Google 
            </button>
            <button class="btn bg-[#03C755] text-white border-[#00b544] flex items-center px-4 py-2 rounded-lg hover:shadow-md transition">
              <img src="/line.svg" alt="LINE" class="w-5 h-5 mr-2" /> register for LINE
            </button>
          </div>

          <button @click="goToPreferences" class="block mx-auto mt-6 px-6 py-2 rounded-lg font-semibold bg-[#860914] text-[#ffffff] hover:bg-[#aa666c] hover:text-[#3A3435] hover:shadow-xl transition">
            下一步
          </button>

          <!-- 登入提示 -->
          <div class="text-center mt-4 pt-4 border-t border-gray-300">
            <span class="text-sm text-gray-600">已有帳號？</span>
            <router-link to="/login" class="text-sm text-[#860914] hover:underline ml-1">
              立即登入
            </router-link>
          </div>
        </div>

        <!-- Step 2: 偏好選擇 -->
        <div v-else class="space-y-4 mt-6">
          <h2 class="text-xl font-semibold mb-4 text-[#860914]">選擇你的酒吧偏好</h2>

          <div>
            <h3 class="text-lg font-medium mb-2 text-[#aa666c]">酒吧類型</h3>
            <div class="grid grid-cols-3 grid-rows-2 gap-3 ">
              <button v-for="type in barTypes" :key="type" 
                @click="toggleSelection(form.preferences.types, type)"
                :class="['text-sm py-2 rounded-full border transition duration-200 cursor-pointer',
                form.preferences.types.includes(type)
                ? 'bg-[#860914] text-white border-[#860914]'
                : 'bg-[#3A3435] text-[#f8ecec] border-[#3A3435]']">
                {{ type }}
              </button>
            </div>
          </div>

          <div>
            <h3 class="text-lg font-medium mb-2 text-[#aa666c]">酒吧氛圍</h3>
            <div class="grid grid-cols-3 grid-rows-2 gap-2">
              <button v-for="mood in barMoods" :key="mood"
                @click="toggleSelection(form.preferences.moods, mood)"
                :class="['text-sm py-2 rounded-full border transition duration-200 cursor-pointer',
                form.preferences.moods.includes(mood)
                ? 'bg-[#860914] text-white border-[#860914]'
                : 'bg-[#3A3435] text-[#f8ecec] border-[#3A3435]']">
                {{ mood }}
              </button>
            </div>
          </div>

          <div class="flex justify-between mt-6">
            <button @click="step = 1" class="text-sm text-[#aa666c] hover:text-[#860914] transition">
              <i class="fa-solid fa-arrow-left mr-1"></i> 返回
            </button>
            <button
              @click="submitRegistration"
              class="px-6 py-2 rounded-lg font-semibold bg-[#860914] text-[#ffffff] hover:bg-[#aa666c] hover:text-[#3A3435] hover:shadow-xl transition">
              完成註冊
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const step = ref(1)

const form = ref({
  name: '',
  nickname: '',
  phone: '',
  password: '',
  birthday: '',
  preferences: {
    types: [],
    moods: []
  }
})

const registerFields = [
  { model: 'name', placeholder: '姓名', icon: 'fa-solid fa-user', type: 'text' },
  { model: 'nickname', placeholder: '暱稱', icon: 'fa-solid fa-user-pen', type: 'text' },
  { model: 'phone', placeholder: '手機號碼', icon: 'fa-solid fa-phone', type: 'tel' },
  { model: 'password', placeholder: '密碼', icon: 'fa-solid fa-key', type: 'password' },
  { model: 'birthday', placeholder: '生日', icon: 'fa-solid fa-cake-candles', type: 'date' },
]

const barTypes = ['運動酒吧', '音樂酒吧', '學生酒吧', '餐酒館', '暢飲店']
const barMoods = ['熱鬧歡樂', '浪漫私密', '復古懷舊', '高級精緻', '輕鬆悠閒']

const goToPreferences = () => {
  // 簡單驗證
  if (!form.value.name || !form.value.phone || !form.value.password) {
    alert('請填寫完整資訊')
    return
  }
  step.value = 2
}

const toggleSelection = (arr, value) => {
  const index = arr.indexOf(value)
  if (index > -1) arr.splice(index, 1)
  else arr.push(value)
}

const submitRegistration = () => {
  console.log('送出資料：', form.value)
  alert('已送出註冊資料，請前往 Email 驗證帳號！')
}
</script>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.4s ease;
}
.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(100px);
}
.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-100px);
}
</style>