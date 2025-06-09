<template>
  <div class="max-w-md mx-auto mt-10 p-6 bg-[#3A3435] rounded-xl shadow-xl">
    <!-- Tabs -->
    <div class="flex border-b">
      <button
        class="flex-1 py-2 text-center font-semibold"
        :class="isLogin ? 'border-b-3 border-[#daa258] text-[#daa258]' : 'text-[#b0a89c] '"
        @click="isLogin = true">會員登入
      </button>
      <button
        class="flex-1 py-2 text-center font-semibold"
        :class="!isLogin ? 'border-b-3 border-[#daa258] text-[#daa258]' : 'text-[#b0a89c]'"
        @click="isLogin = false">註冊
      </button>
    </div>

    <!-- 登入 -->
    <div v-if="isLogin" class="mt-6 space-y-4">
        <div class="space-y-4">
      <div class="flex items-center border border-gray-300 rounded px-3 py-2">
        <i class="fa-solid fa-phone text-gray-400 mr-2"></i>
        <input
          type="tel"
          placeholder="手機號碼"
          class="w-full outline-none placeholder-[#f9ebd5] text-sm ml-2"
        />
      </div>
      <div class="flex items-center border border-gray-300 rounded px-3 py-2">
        <i class="fa-solid fa-envelope text-gray-400 mr-2"></i>
        <input
          type="email"
          placeholder="電子郵件"
          class="w-full outline-none placeholder-[#f9ebd5] text-sm ml-2"
        />
      </div>
      <div class="relative flex items-center border border-gray-300 rounded px-3 py-2">
        <i class="fa-solid fa-key text-gray-400 mr-2"></i>
        <input :type="showPassword ? 'text' : 'password'" placeholder="密碼" class="w-full outline-none placeholder-[#f9ebd5] text-sm ml-2"/>
        <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" @click="showPassword = !showPassword">
          <i :class="showPassword ? 'fa-regular fa-eye' : 'fa-regular fa-eye-slash'"></i>
        </button>
      </div>
    </div>
    <div class="text-sm text-right mt-1 text-[#daa258]">忘記密碼？</div>

      <!-- 第三方登入 -->
      <div class="flex space-x-2 justify-center mt-4">
        <button class="btn bg-white text-black border-[#e5e5e5] border-2  ">
          <img src="/google.svg" alt="Google logo" class="w-5 h-5 mr-2" />
        Login with Google
      </button>
        <button class="btn bg-[#03C755] text-white border-[#00b544]">
          <img src="/line.svg" alt="Line logo" class="w-5 h-5 mr-2" />
          Login with LINE
        </button>
      </div>

      <!-- 登入按鈕 -->
      <button
        class="w-90 py-2 hover:bg-[#f9ebd5] hover:text-[#3A3435] rounded-lg font-semibold mt-4 hover:shadow-xl bg-[#daa258] text-[#3A3435] transition duration-200 transform hover:scale-101 flex justify-center">
        登入
      </button>

      <!-- 測試帳號登入 -->
      <div class="text-center mt-2 text-sm text-[#e1d9cb] underline underline-offset-4 cursor-pointer">
        使用測試帳號登入
      </div>
    </div>

    <!-- 註冊表單跳轉 -->
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

<style scoped>

</style>



