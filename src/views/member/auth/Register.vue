<template>
  <div class="max-w-md mx-auto mt-10 mb-10 p-6 bg-[#f8ecec] rounded-xl shadow-xl text-[#f9ebd5] relative">
    
    <!-- 成功註冊通知 -->
    <transition name="alert-slide">
      <div v-if="showRegisterSuccess" role="alert" class="alert alert-success absolute -top-8 left-0 right-0 z-10">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>註冊成功！請前往 Email 驗證帳號</span>
      </div>
    </transition>
    
    <!-- Tabs -->
    <div class="flex border-b border-[#f3c4cc]">
      <router-link
        to="/login"
        class="flex-1 py-2 text-center font-semibold text-[#bbbbbb] transition"
        style="color: #bbbbbb;"
        @mouseover="$event.target.style.color = 'var(--color-primary-red)'"
        @mouseleave="$event.target.style.color = '#bbbbbb'">
        會員登入
      </router-link>
      <button
        class="flex-1 py-2 text-center font-semibold border-b-3 border-[#aa666c]"
        style="color: var(--color-primary-red);">
        註冊
      </button>
    </div>

    <!-- 切換動畫 -->
    <transition name="slide-fade" mode="out-in">
      <div :key="step">
        <!-- Step 1: 註冊表單 -->
        <div v-if="step === 1" class="space-y-4 mt-6">
          <h2 class="text-xl font-semibold mb-4" style="color: var(--color-primary-red);">建立帳號</h2>
          
          <div v-for="(field, index) in registerFields" :key="index" class="space-y-1">
            <div 
              :class="[
                'flex items-center border rounded px-3 py-2 transition-colors',
                errors[field.model] 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-400',
                field.type === 'password' ? 'relative' : ''
              ]">
              <i :class="field.icon" class="mr-2" style="color: var(--color-black)"></i>
              <input 
                :type="field.type === 'password' ? (showPassword ? 'text' : 'password') : field.type" 
                :placeholder="field.placeholder" 
                v-model="form[field.model]"
                @input="clearError(field.model)"
                :class="[
                  'w-full outline-none placeholder-opacity-70 transition-colors text-sm',
                  errors[field.model] 
                    ? 'text-red-600 placeholder-red-400' 
                    : 'text-[var(--color-primary-red)] placeholder-[var(--color-primary-red)]'
                ]"
                :style="!errors[field.model] ? 'text-[var(--color-primary-red)]' : ''"
              />
              <!-- 密碼眼睛圖示 -->
              <button 
                v-if="field.type === 'password'" 
                type="button" 
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" 
                @click="showPassword = !showPassword">
                <i :class="showPassword ? 'fa-regular fa-eye' : 'fa-regular fa-eye-slash'"></i>
              </button>
            </div>
            <!-- 錯誤提示文字 -->
            <div v-if="errors[field.model]" class="text-red-500 text-xs ml-1">
              {{ field.placeholder }}為必填欄位
            </div>
          </div>

          <!-- 快速加入 -->
          <div class="text-center text-sm text-gray-300 my-4 flex items-center">
            <div class="flex-grow h-px bg-gray-400"></div>
            <span class="mx-2" style="color: var(--color-primary-red);">或</span>
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

        <button
          @click="goToPreferences"
          class="block mx-auto mt-6 px-6 py-2 rounded-lg font-semibold text-white bg-[var(--color-primary-red)] hover:bg-[#aa666c] hover:text-[var(--color-black)] hover:shadow-xl transition">
          下一步
        </button>

          <!-- 登入提示 -->
          <div class="text-center mt-4 pt-4 border-t border-gray-300">
            <span class="text-sm text-gray-600">已有帳號？</span>
            <router-link to="/login" class="text-sm hover:underline ml-1" style="color: var(--color-primary-red);">
              立即登入
            </router-link>
          </div>
        </div>

        <!-- Step 2: 偏好選擇 -->
        <div v-else class="space-y-4 mt-6">
          <h2 class="text-xl font-semibold mb-4" style="color: var(--color-primary-red);">選擇你的酒吧偏好</h2>

          <div>
            <h3 class="text-lg font-medium mb-2 text-[#aa666c]">酒吧類型</h3>
            <div class="grid grid-cols-3 grid-rows-2 gap-3 ">
              <button v-for="type in barTypes" :key="type" 
                @click="toggleSelection(form.preferences.types, type)"
                :class="['text-sm py-2 rounded-full border transition duration-200 cursor-pointer']"
                :style="form.preferences.types.includes(type)
                  ? 'background-color: var(--color-primary-red); color: white; border-color: var(--color-primary-red);'
                  : 'background-color: var(--color-black); color: #f8ecec; border-color: var(--color-black);'">
                {{ type }}
              </button>
            </div>
          </div>

          <div>
            <h3 class="text-lg font-medium mb-2 text-[#aa666c]">酒吧氛圍</h3>
            <div class="grid grid-cols-3 grid-rows-2 gap-2">
              <button v-for="mood in barMoods" :key="mood"
                @click="toggleSelection(form.preferences.moods, mood)"
                :class="['text-sm py-2 rounded-full border transition duration-200 cursor-pointer']"
                :style="form.preferences.moods.includes(mood)
                  ? 'background-color: var(--color-primary-red); color: white; border-color: var(--color-primary-red);'
                  : 'background-color: var(--color-black); color: #f8ecec; border-color: var(--color-black);'">
                {{ mood }}
              </button>
            </div>
          </div>

          <div class="flex justify-between mt-6">
            <button @click="step = 1" class="text-sm text-[#aa666c] transition"
                    @mouseover="$event.target.style.color = 'var(--color-primary-red)'"
                    @mouseleave="$event.target.style.color = '#aa666c'">
              <i class="fa-solid fa-arrow-left mr-1"></i> 返回
            </button>
            <button
              @click="submitRegistration"
              class="px-6 py-2 rounded-lg font-semibold text-white bg-[var(--color-primary-red)] hover:bg-[#aa666c] hover:text-[var(--color-black)] hover:shadow-xl transition">
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
const showPassword = ref(false)
const showRegisterSuccess = ref(false)

const form = ref({
  name: '',
  nickname: '',
  password: '',
  birthday: '',
  preferences: {
    types: [],
    moods: []
  }
})

const registerFields = [
  { model: 'name', placeholder: ' 姓名', icon: 'fa-solid fa-user', type: 'text' },
  { model: 'nickname', placeholder: '暱稱', icon: 'fa-solid fa-user-pen', type: 'text' },
  { model: 'password', placeholder: ' 密碼', icon: 'fa-solid fa-key', type: 'password' },
  { model: 'birthday', placeholder: ' 生日', icon: 'fa-solid fa-cake-candles', type: 'date' },
]

const barTypes = ['運動酒吧', '音樂酒吧', '學生酒吧', '餐酒館', '暢飲店']
const barMoods = ['熱鬧歡樂', '浪漫私密', '復古懷舊', '高級精緻', '輕鬆悠閒']

// 紀錄每個欄位是否有錯誤
const errors = ref({
  name: false,
  nickname: false,
  password: false,
  birthday: false
})

// 清除單一欄位的錯誤狀態
const clearError = (fieldName) => {
  if (errors.value[fieldName]) {
    errors.value[fieldName] = false
  }
}

const goToPreferences = () => {
  let valid = true
  
  // 檢查每個必填欄位
  registerFields.forEach(field => {
    if (!form.value[field.model] || form.value[field.model].trim() === '') {
      errors.value[field.model] = true
      valid = false
    } else {
      errors.value[field.model] = false
    }
  })
  
  // 如果有錯誤就不進入下一步
  if (!valid) {
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
  
  // 顯示成功通知
  showRegisterSuccess.value = true
  
  // 3秒後自動隱藏通知
  setTimeout(() => {
    showRegisterSuccess.value = false
  }, 3000)
}
</script>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.2s ease;
}
.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(100px);
}
.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-100px);
}

/* 通知動畫 */
.alert-slide-enter-active {
  transition: all 0.4s ease-out;
}
.alert-slide-leave-active {
  transition: all 0.2s ease-in;
}
.alert-slide-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}
.alert-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>