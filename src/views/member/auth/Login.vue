<template>
  <div class="max-w-md mx-auto mt-10 p-6 bg-white rounded-xl shadow-md">
    <!-- Tabs -->
    <div class="flex border-b">
      <button
        class="flex-1 py-2 text-center font-semibold"
        :class="isLogin ? 'border-b-2 border-gray-600' : 'text-gray-400'"
        @click="isLogin = true">會員登入
      </button>
      <button
        class="flex-1 py-2 text-center font-semibold"
        :class="!isLogin ? 'border-b-2 border-gray-600' : 'text-gray-400'"
        @click="isLogin = false">註冊
      </button>
    </div>

    <!-- 登入表單 -->
    <div v-if="isLogin" class="mt-6 space-y-4">
      <div class="flex items-center space-x-2">
        <select class="px-3 py-2 border rounded-full text-sm bg-gray-100">
          <option>+886</option>
        </select>
        <input
          type="tel"
          placeholder="手機號碼"
          class="flex-1 border-b outline-none pb-1"
        />
      </div>

      <div class="relative">
        <input
          :type="showPassword ? 'text' : 'password'"
          placeholder="密碼"
          class="w-full border-b outline-none pb-1"
        />
        <button
          type="button"
          class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
          @click="showPassword = !showPassword">👁️
        </button>
        <div class="text-sm text-right mt-1 text-gray-500">忘記密碼？</div>
      </div>

      <!-- 第三方登入 -->
      <div class="flex space-x-2 justify-center mt-4">
        <button class="btn bg-white text-black border-[#e5e5e5] border-2 hover:bg-gray-100 ">
        <svg aria-label="Google logo" width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><g><path d="m0 0H512V512H0" fill="#fff"></path><path fill="#34a853" d="M153 292c30 82 118 95 171 60h62v48A192 192 0 0190 341"></path><path fill="#4285f4" d="m386 400a140 175 0 0053-179H260v74h102q-7 37-38 57"></path><path fill="#fbbc02" d="m90 341a208 200 0 010-171l63 49q-12 37 0 73"></path><path fill="#ea4335" d="m153 219c22-69 116-109 179-50l55-54c-78-75-230-72-297 55"></path></g></svg>
        Login with Google
      </button>
        <button class="btn bg-[#03C755] text-white border-[#00b544]">
          <svg aria-label="Line logo" width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><g fill-rule="evenodd" stroke-linejoin="round" fill="white"><path fill-rule="nonzero" d="M12.91 6.57c.232 0 .42.19.42.42 0 .23-.188.42-.42.42h-1.17v.75h1.17a.42.42 0 1 1 0 .84h-1.59a.42.42 0 0 1-.418-.42V5.4c0-.23.188-.42.42-.42h1.59a.42.42 0 0 1-.002.84h-1.17v.75h1.17zm-2.57 2.01a.421.421 0 0 1-.757.251l-1.63-2.217V8.58a.42.42 0 0 1-.42.42.42.42 0 0 1-.418-.42V5.4a.418.418 0 0 1 .755-.249L9.5 7.366V5.4c0-.23.188-.42.42-.42.23 0 .42.19.42.42v3.18zm-3.828 0c0 .23-.188.42-.42.42a.42.42 0 0 1-.418-.42V5.4c0-.23.188-.42.42-.42.23 0 .418.19.418.42v3.18zM4.868 9h-1.59c-.23 0-.42-.19-.42-.42V5.4c0-.23.19-.42.42-.42.232 0 .42.19.42.42v2.76h1.17a.42.42 0 1 1 0 .84M16 6.87C16 3.29 12.41.376 8 .376S0 3.29 0 6.87c0 3.208 2.846 5.896 6.69 6.405.26.056.615.172.705.394.08.2.053.518.026.722 0 0-.092.565-.113.685-.035.203-.16.79.693.432.854-.36 4.607-2.714 6.285-4.646C15.445 9.594 16 8.302 16 6.87"></path></g></svg>
          Login with LINE
        </button>
      </div>

      <!-- 登入按鈕 -->
      <button
        class="w-full py-2 bg-gray-400 text-white rounded-lg font-semibold mt-4"
      >
        登入
      </button>

      <!-- 測試帳號登入 -->
      <div class="text-center mt-2 text-sm text-gray-500 underline cursor-pointer">
        使用測試帳號登入
      </div>
    </div>

    <!-- 註冊表單（尚未實作） -->
    <div v-else class="mt-6 text-center text-gray-400">
      xxx
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const isLogin = ref(true)
const showPassword = ref(false)
</script>



