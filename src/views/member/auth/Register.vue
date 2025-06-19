<template>
  <div class="flex justify-center items-start pt-10 px-4 min-h-screen">
    <div class="max-w-[424px] mx-auto p-6 bg-[var(--color-black)] rounded-xl shadow-xl  relative">
    
    <transition name="alert-slide">
      <div v-if="showRegisterSuccess" role="alert" class="alert alert-success absolute -top-8 left-0 right-0 z-10">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>註冊成功！請前往 Email 驗證帳號</span>
      </div>
    </transition>
    
    <div class="flex border-b border-[var(--color-icon-secondary)]">
      <router-link to="/login" class="flex-1 py-2 text-center font-semibold text-[var(--color-icon-secondary)] hover:text-[var(--color-secondary-green)] transition">
        會員登入
      </router-link>
      <button
        class="flex-1 py-2 text-center font-semibold border-b-3 border-[var(--color-text-salmon-pink)]"
        style="color: var(--color-secondary-green);">
        註冊
      </button>
    </div>

    <transition name="slide-fade" mode="out-in">
      <div :key="step" class="w-[380px]">
        <!-- Step 1: 註冊表單 -->
        <div v-if="step === 1" class="space-y-4 mt-6">
          <h2 class="text-lg font-semibold mb-4" style="color: var(--color-primary-orange);">建立帳號</h2>
          
          <div v-for="(field, index) in registerFields" :key="index" class="space-y-1">
            <div 
              :class="[
                'flex items-center border rounded px-3 py-2 transition-colors',
                errors[field.model] 
                  ? 'border-[var(--color-primary-orange)] border-2 bg-white' 
                  : 'border-[var(--color-icon-secondary)]',
                field.type === 'password' ? 'relative' : ''
              ]">
              <i :class="[ field.icon,'mr-2',
                  errors[field.model] ? 'text-[var(--color-black)]' : 'text-[var(--color-icon-secondary)]'
                ]"
              />
              <input 
                :type="field.type === 'password' ? (showPassword ? 'text' : 'password') : field.type" 
                :placeholder="field.placeholder" 
                v-model="registrationForm[field.model]"
                @input="clearError(field.model)"
                :class="[
                  'w-full outline-none placeholder-opacity-70 transition-colors text-sm',
                  errors[field.model] 
                    ? 'text-[var(--color-primary-orange)] placeholder-[var(--color-primary-orange)]' 
                    : 'text-[var(--color-secondary-green)] placeholder-[var(--color-secondary-green)]'
                ]"
                :style="!errors[field.model] ? 'text-[var(--color-primary-orange)]' : ''"
              />

              <button
                v-if="field.type === 'password'" type="button"
                :class="[
                  'absolute right-3 top-1/2 -translate-y-1/2',
                  errors[field.model] ? 'text-[var(--color-black)]' : 'text-[var(--color-icon-secondary)]'
                ]"
                @click="showPassword = !showPassword">
                <i :class="showPassword ? 'fa-regular fa-eye' : 'fa-regular fa-eye-slash'"></i>
              </button>
            </div>

            <!-- 顯示具體的錯誤訊息 -->
            <div v-if="errors[field.model]" class="text-[var(--color-primary-orange)] text-xs ml-1">
              <span v-if="field.model === 'username'">{{ usernameErrorMessage }}</span>
              <span v-else-if="field.model === 'nickname'">{{ nicknameErrorMessage }}</span>
              <span v-else-if="field.model === 'email'">{{ emailErrorMessage }}</span>
              <span v-else-if="field.model === 'password'">{{ passwordErrorMessage }}</span>
              <span v-else-if="field.model === 'birthday'">{{ birthdayErrorMessage }}</span>
              <span v-else>{{ field.placeholder }}為必填欄位</span>
            </div>
          </div>

          <div class="text-center text-sm text-gray-300 my-4 flex items-center">
            <div class="flex-grow h-px bg-gray-300"></div>
            <span class="mx-2 text-gray-300">或</span>
            <div class="flex-grow h-px bg-gray-300"></div>
          </div>
          <div class="flex space-x-2 justify-center">
            <button class="btn bg-white text-black border-[#e5e5e5] border-2 flex items-center px-4 py-2 rounded-lg hover:shadow-md transition">
              <img src="/google.svg" alt="Google" class="w-5 h-5 mr-2" /> register for Google 
            </button>
            <button @click="handleLineLogin" 
                    :disabled="authStore.isLoading" 
                    class="btn bg-[var(--color-line-green)] text-white border-[var(--color-line-green-dark)] border-2 flex items-center px-4 py-2 rounded-lg hover:shadow-md transition">
                    <img src="/line.svg" alt="LINE" class="w-5 h-5 mr-2" />
                    <span v-if="authStore.isLineLoading">載入中...</span>
                    <span v-else>Register for LINE</span>
            </button>
          </div>

        <button
          @click="goToPreferences"
          class="block mx-auto mt-6 px-6 py-2 bg-gradient-to-r from-[var(--color-secondary-green)] via-[#d8dbaf] to-[var(--color-primary-orange)] text-[var(--color-black)] rounded-lg font-semibold text-sm mt-4 shadow-md transition duration-300 transform hover:scale-105 hover:brightness-110 hover:shadow-lg">
          下一步
        </button>

          <!-- 登入提示 -->
          <div class="text-center mt-4 pt-4 border-t border-gray-300">
            <span class="text-sm text-gray-300">已有帳號？</span>
            <router-link
              to="/login"
              class="text-sm hover:underline underline-offset-4 ml-1 text-[var(--color-secondary-green)]">
              立即登入
            </router-link>
          </div>
        </div>

        <!-- Step 2: 偏好選擇 -->
        <div v-else class="space-y-4 mt-6">
          <h2 class="text-lg font-semibold mb-4 text-[var(--color-primary-orange)]">選擇你的酒吧偏好</h2>

          <div>
            <h3 class="text-base font-medium mb-2 text-[var(--color-secondary-green)]">酒吧類型</h3>
            <div class="grid grid-cols-3 gap-3 ">
              <button v-for="type in barTypes" :key="type" 
                @click="toggleSelection(registrationForm.preferences.types, type)"
                :class="['min-w-[80px] text-sm py-2 rounded-full border transition duration-200 cursor-pointer']"
                :style="registrationForm.preferences.types.includes(type)
                  ? 'background-color: var(--color-primary-orange); color: white; border-color: var(--color-primary-orange);'
                  : 'background-color: var(--color-icon-secondary); color: var(--color-black); border-color: var(--color-black);'">
                {{ type }}
              </button>
            </div>
          </div>

          <div>
            <h3 class="text-base font-medium mb-2 text-[var(--color-secondary-green)]">酒吧氛圍</h3>
            <div class="grid grid-cols-3 gap-2">
              <button v-for="mood in barMoods" :key="mood"
                @click="toggleSelection(registrationForm.preferences.moods, mood)"
                :class="['min-w-[80px] text-sm py-2 rounded-full border transition duration-200 cursor-pointer']"
                :style="registrationForm.preferences.moods.includes(mood)
                  ? 'background-color: var(--color-primary-orange); color: white; border-color: var(--color-primary-orange);'
                  : 'background-color: var(--color-icon-secondary); color: var(--color-black); border-color: var(--color-black);'">
                {{ mood }}
              </button>
            </div>
          </div>

          <div class="flex justify-between mt-6">
            <button
              @click="step = 1"
              class="text-sm text-[var(--color-primary-orange)] hover:text-[var(--color-secondary-green)] active:text-[var(--color-text-warn)] transition-colors duration-200">
              <i class="fa-solid fa-arrow-left mr-1"></i> 返回
            </button>
            <button
              @click="handleEmailRegistration"
              :disabled="authStore.isLoading"
              class="px-4 py-2 bg-gradient-to-r from-[var(--color-secondary-green)] via-[#d8dbaf] to-[var(--color-primary-orange)] text-[var(--color-black)] rounded-lg font-medium shadow-md transition duration-300 transform hover:scale-105 hover:brightness-110 hover:shadow-lg">
              <span v-if="authStore.isEmailLoading">註冊中...</span>
              <span v-else>完成註冊</span>
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
  </div>
  
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore'

const step = ref(1);
const showPassword = ref(false);
const showRegisterSuccess = ref(false);

const authStore = useAuthStore();
const router = useRouter();

const registrationForm = ref({
  username: '',
  nickname: '',
  email: '',
  password: '',
  birthday: '',
  preferences: {
    types: [],
    moods: []
  }
});

const registerFields = [
  { model: 'username', placeholder: ' 姓名', icon: 'fa-solid fa-user', type: 'text' },
  { model: 'nickname', placeholder: '暱稱 (選填)', icon: 'fa-solid fa-user-pen', type: 'text' },
  { model: 'email', placeholder: '電子郵件', icon: 'fa-solid fa-envelope', type: 'email' },
  { model: 'password', placeholder: ' 密碼', icon: 'fa-solid fa-key', type: 'password' },
  { model: 'birthday', placeholder: ' 生日 (選填)', icon: 'fa-solid fa-cake-candles', type: 'date' },
]

const barTypes = ['運動酒吧', '音樂酒吧', '學生酒吧', '餐酒館', '暢飲店'];
const barMoods = ['熱鬧歡樂', '浪漫私密', '復古懷舊', '高級精緻', '輕鬆悠閒'];

// 紀錄每個欄位是否有錯誤
const errors = ref({
  username: false,
  nickname: false,
  email: false,
  password: false,
  birthday: false
});

// 錯誤訊息
const usernameErrorMessage = ref('');
const nicknameErrorMessage = ref('');
const emailErrorMessage = ref('');
const passwordErrorMessage = ref('');
const birthdayErrorMessage = ref('');

const clearError = (fieldName) => {
  if (errors.value[fieldName]) {
    errors.value[fieldName] = false;
    
    // 清除對應的錯誤訊息
    if (fieldName === 'username') {
      usernameErrorMessage.value = ''
    } else if (fieldName === 'nickname') {
      nicknameErrorMessage.value = ''
    } else if (fieldName === 'email') {
      emailErrorMessage.value = ''
    } else if (fieldName === 'password') {
      passwordErrorMessage.value = ''
    } else if (fieldName === 'birthday') {
      birthdayErrorMessage.value = ''
    }
  }
}

const validateUsername = (username) => {
  if (!username || username.trim() === '') {
    usernameErrorMessage.value = '姓名為必填欄位';
    return false;
  }

  return true;
}

const validateEmail = (email) => {
  if (!email || email.trim() === '') {
    emailErrorMessage.value = '電子郵件為必填欄位';
    return false;
  }
  
  if (!email.includes('@')) {
    emailErrorMessage.value = '電子郵件格式不正確，必須包含@符號';
    return false;
  }

  const hasEnglish = /[a-zA-Z]/.test(email)
  if (!hasEnglish) {
    emailErrorMessage.value = '電子郵件必須包含英文字母';
    return false;
  }
  return true;
}

// 驗證密碼格式
const validatePassword = (password) => {
  if (!password || password.trim() === '') {
    passwordErrorMessage.value = '密碼為必填欄位';
    return false;
  }

  if (password.length < 8) {
    passwordErrorMessage.value = '密碼至少需要8個字元';
    return false;
  }

  const hasEnglish = /[a-zA-Z]/.test(password);
  if (!hasEnglish) {
    passwordErrorMessage.value = '密碼必須包含英文字母';
    return false;
  }

  const hasNumber = /\d/.test(password)
  if (!hasNumber) {
    passwordErrorMessage.value = '密碼必須包含數字';
    return false;
  }
  return true;
}

// 驗證生日格式
const validateBirthday = (birthday) => {
  if (!birthday || birthday.trim() === '') {
    return true;
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(birthday)) {
    birthdayErrorMessage.value = '生日格式錯誤，請使用 YYYY-MM-DD 格式';
    return false;
  }

  // 檢查是否為未來日期
  const birthDate = new Date(birthday);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  birthDate.setHours(0, 0, 0, 0);
  
  if (birthDate >= today) {
    birthdayErrorMessage.value = '生日必須是過去的日期';
    return false;
  }

  return true;
}


const goToPreferences = () => {
  let valid = true

  if (!validateUsername(registrationForm.value.username)) {
    errors.value.username = true;
    valid = false;
  } else {
    errors.value.username = false;
  }

  if (!validateEmail(registrationForm.value.email)) {
    errors.value.email = true;
    valid = false;
  } else {
    errors.value.email = false;
  }

  if (!validatePassword(registrationForm.value.password)) {
    errors.value.password = true;
    valid = false;
  } else {
    errors.value.password = false;
  }

  if (!validateBirthday(registrationForm.value.birthday)) {
    errors.value.birthday = true;
    valid = false;
  } else {
    errors.value.birthday = false;
  }

  // 如果有錯誤就不進入下一步
  if (!valid) {
    return
  }

  step.value = 2
}

const toggleSelection = (arr, value) => {
  const index = arr.indexOf(value);
  if (index > -1) arr.splice(index, 1);
  else arr.push(value);
}

const handleEmailRegistration = async () => {
  const preferencesData = {
    sport: registrationForm.value.preferences.types.includes('運動酒吧'),
    music: registrationForm.value.preferences.types.includes('音樂酒吧'),
    student: registrationForm.value.preferences.types.includes('學生酒吧'),
    bistro: registrationForm.value.preferences.types.includes('餐酒館'),
    drink: registrationForm.value.preferences.types.includes('暢飲店'),
    joy: registrationForm.value.preferences.moods.includes('熱鬧歡樂'),
    romantic: registrationForm.value.preferences.moods.includes('浪漫私密'),
    oldschool: registrationForm.value.preferences.moods.includes('復古懷舊'),
    highlevel: registrationForm.value.preferences.moods.includes('高級精緻'),
    easy: registrationForm.value.preferences.moods.includes('輕鬆悠閒')
  };

  const userData = {
    username: registrationForm.value.username,
    nickname: registrationForm.value.nickname || undefined,
    email: registrationForm.value.email,
    password: registrationForm.value.password,
    birthday: registrationForm.value.birthday || undefined,
    preferences: preferencesData 
  }
  console.log('送出資料：', userData);

  try {
    const success = await authStore.emailSignup(userData);

    if (success) {
      showRegisterSuccess.value = true

      registrationForm.value = {
        username: '',
        nickname: '',
        email: '',
        password: '',
        birthday: '',
        preferences: {
          types: [],
          moods: []
        }
      };

      step.value = 1;

      setTimeout(() => {
        showRegisterSuccess.value = false;
        router.push('/login')
      }, 3000)
    }
  } catch(err) {
    console.error('註冊失敗:', err);
    showRegisterSuccess.value = false
  }
}

const handleLineLogin = async () => {
  await authStore.lineLogin()
}

// 組件掛載時檢查 LINE 登入狀態
onMounted(async () => {
  // 初始化 store
  authStore.init()
  // 檢查 LINE 登入回調
  const result = await authStore.checkLineCallback()
  if (result?.success) {
    router.push(result.redirect)
  }
})
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