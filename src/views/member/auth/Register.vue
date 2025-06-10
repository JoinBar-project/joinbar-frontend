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

const goToPreferences = () => {
  step.value = 2
}



</script>