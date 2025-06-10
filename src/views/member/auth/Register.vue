<template>
  <div class="max-w-md mx-auto mt-10 p-6 bg-[#3A3435] rounded-xl shadow-xl text-[#f9ebd5]">

      <div :key="step">
        <!-- Step 1: 註冊表單 -->
        <div v-if="step === 1" class="space-y-4">
          <h2 class="text-xl font-semibold mb-4">建立帳號</h2>
          <div v-for="(field, index) in registerFields" :key="index" class="flex items-center border border-gray-300 rounded px-3 py-2">
            <i :class="field.icon" class="text-gray-400 mr-2"></i>
            <input :type="field.type" :placeholder="field.placeholder" v-model="form[field.model]"
              class="w-full outline-none placeholder-[#f9ebd5] bg-transparent text-[#f9ebd5]"/>
          </div>

          <!-- 快速加入 -->
          <div class="text-center text-sm text-gray-300 my-4 flex items-center">
            <div class="flex-grow h-px bg-gray-400"></div>
            <span class="mx-2">或</span>
            <div class="flex-grow h-px bg-gray-400"></div>
          </div>
          <div class="flex space-x-2 justify-center">
            <button class="btn bg-white text-black border-[#e5e5e5] border-2 flex items-center">
              <img src="/google.svg" alt="Google" class="w-5 h-5 mr-2" /> Google 加入
            </button>
            <button class="btn bg-[#03C755] text-white border-[#00b544] flex items-center">
              <img src="/line.svg" alt="LINE" class="w-5 h-5 mr-2" /> LINE 加入
            </button>
          </div>
          <!-- 快速加入會員 -->
          <button
            @click="goToPreferences"
            class="block mx-auto mt-6 px-6 py-2 rounded-lg font-semibold bg-[#daa258] text-[#3A3435] hover:bg-[#f9ebd5] hover:text-[#3A3435] hover:shadow-xl transition">
            下一步
          </button>
        </div>
        <!-- Step 2: 偏好選擇 -->
        <div v-else class="space-y-4">
            <h2 class="text-xl font-semibold mb-4">選擇你的酒吧偏好</h2>
          <div>
            <h3 class="text-lg font-medium mb-2">類型：</h3>
          <div class="flex flex-wrap gap-2">
              <button v-for="type in barTypes" :key="type" @click="toggleSelection(form.preferences.types, type)" :class="selectedClass(form.preferences.types.includes(type))"> {{ type }}
              </button>
          </div>
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
  step.value = 2
}

const toggleSelection = (arr, value) => {
  const index = arr.indexOf(value)
  if (index > -1) arr.splice(index, 1)
  else arr.push(value)
}

const selectedClass = (selected) =>
  `px-3 py-1 rounded-full border transition text-sm font-medium ${
    selected ? 'bg-[#daa258] text-[#3A3435]' : 'bg-[#4a4546] text-[#f9ebd5]'
  }`



</script>