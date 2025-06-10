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
</script>