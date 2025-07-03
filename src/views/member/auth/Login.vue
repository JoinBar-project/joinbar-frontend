<template>
  <div class="flex justify-center items-start pt-10 pb-10 min-h-[calc(100vh-6rem)]">
    <div class="relative w-full max-w-[424px] max-md:max-w-[90vw] mx-auto p-6 max-md:px-4 bg-[var(--color-black)] rounded-xl shadow-xl">
      <!-- 登入 / 註冊 tab -->
      <div class="flex border-b border-[var(--color-icon-secondary)]">
        <button
          class="flex-1 py-2 text-center font-semibold border-b-3 border-[var(--color-secondary-green)] text-[var(--color-secondary-green)]">
          會員登入
        </button>
        <router-link
          to="/register"
          class="flex-1 py-2 text-center font-semibold text-[var(--color-icon-secondary)] hover:text-[var(--color-secondary-green)] transition">
          註冊
        </router-link>
      </div>

      <div v-if="isLogin" class="mt-6 space-y-4">
        <!-- Email 輸入 -->
        <div class="space-y-1">
          <div
            :class="[
              'flex items-center border rounded px-3 py-2 transition-colors',
              errors.email
                ? 'border-[var(--color-primary-orange)] border-2 bg-white'
                : 'border-[var(--color-icon-secondary)]'
            ]">
            <i
              class="mr-2 fa-solid fa-envelope"
              :class="errors.email ? 'text-[var(--color-black)]' : 'text-[var(--color-icon-secondary)]'">
            </i>
            <input
              type="email"
              placeholder="電子郵件"
              v-model="loginForm.email"
              @input="clearError('email')"
              :disabled="authStore.isAnyLoading"
              :class="[
                'w-full outline-none placeholder-opacity-70 transition-colors text-sm ml-2',
                errors.email
                  ? 'text-[var(--color-primary-orange)] placeholder-[var(--color-primary-orange)]'
                  : 'text-[var(--color-secondary-green)] placeholder-[var(--color-secondary-green)]'
              ]" />
          </div>
          <div v-if="errors.email" class="text-[var(--color-primary-orange)] text-xs ml-1">
            {{ emailErrorMessage }}
          </div>
        </div>

        <!-- 密碼 -->
        <div class="space-y-1">
          <div
            :class="[
              'relative flex items-center border rounded px-3 py-2 transition-colors',
              errors.password
                ? 'border-[var(--color-primary-orange)] border-2 bg-white'
                : 'border-[var(--color-icon-secondary)]'
            ]">
            <i
              class="mr-2 fa-solid fa-key"
              :class="errors.password ? 'text-[var(--color-black)]' : 'text-[var(--color-icon-secondary)]'">
            </i>
            <input
              :type="showPassword ? 'text' : 'password'"
              placeholder="密碼"
              v-model="loginForm.password"
              @input="clearError('password')"
              :disabled="authStore.isAnyLoading"
              :class="[
                'w-full outline-none placeholder-opacity-70 transition-colors text-sm ml-2',
                errors.password
                  ? 'text-[var(--color-primary-orange)] placeholder-[var(--color-primary-orange)]'
                  : 'text-[var(--color-secondary-green)] placeholder-[var(--color-secondary-green)]'
              ]" />
            <button
              type="button"
              class="absolute -translate-y-1/2 right-3 top-1/2"
              :class="errors.password ? 'text-[var(--color-black)]' : 'text-[var(--color-icon-secondary)]'"
              @click="showPassword = !showPassword">
              <i :class="showPassword ? 'fa-regular fa-eye' : 'fa-regular fa-eye-slash'"></i>
            </button>
          </div>
          <div v-if="errors.password" class="text-[var(--color-primary-orange)] text-xs ml-1">
            {{ passwordErrorMessage }}
          </div>
        </div>
      </div>

      <div class="text-xs text-right mt-1 text-[var(--color-primary-orange)] cursor-pointer hover:underline underline-offset-4">
        忘記密碼？
      </div>

      <!-- 分隔線 -->
      <div class="flex items-center my-4">
        <div class="flex-grow h-px bg-gray-300"></div>
        <span class="px-4 text-sm text-gray-300">或</span>
        <div class="flex-grow h-px bg-gray-300"></div>
      </div>

      <!-- 社群登入 -->
      <div class="flex flex-col sm:flex-row justify-center items-center mt-4 gap-3 sm:space-x-2">
        <button
          class="btn bg-white text-black border-[#e5e5e5] border-2 flex items-center justify-center px-4 py-2 rounded-lg hover:scale-105 transition text-sm w-full sm:w-auto">
          <img src="/google.svg" alt="Google logo" class="w-5 h-5 mr-2" />
          Login with Google
        </button>

        <button
          @click="handleLineLogin"
          class="btn bg-[var(--color-line-green)] text-white border-[var(--color-line-green-dark)] border-2 flex items-center justify-center px-4 py-2 rounded-lg hover:scale-105 transition text-sm w-full sm:w-auto">
          <img src="/line.svg" alt="Line logo" class="w-5 h-5 mr-2" />
          <span v-if="authStore.isLineLoading">載入中...</span>
          <span v-else>Login with LINE</span>
        </button>
      </div>

      <!-- 登入按鈕 -->
      <div class="flex justify-center">
        <button
          @click="handleEmailLogin"
          :disabled="authStore.isEmailLoading"
          class="w-full max-w-[180px] py-2 bg-gradient-to-r from-[var(--color-secondary-green)] via-[#d8dbaf] to-[var(--color-primary-orange)] text-[var(--color-black)] rounded-lg font-semibold mt-4 shadow-md transition duration-300 transform hover:scale-105 hover:brightness-110 hover:shadow-lg">
          <span v-if="authStore.isEmailLoading">登入中...</span>
          <span v-else>登入</span>
        </button>
      </div>

      <!-- 測試帳號 -->
      <div
        class="text-center mt-2 text-sm text-[var(--color-primary-orange)] underline underline-offset-4 cursor-pointer hover:text-[var(--color-secondary-green)] transition"
        @click="useTestAccount">
        測試帳號登入
      </div>

      <!-- 註冊區 -->
      <div class="pt-4 mt-4 text-center border-t border-gray-300">
        <span class="text-sm text-gray-300">還沒有帳號？</span>
        <router-link
          to="/register"
          class="text-sm text-[var(--color-secondary-green)] hover:underline underline-offset-4">
          立即註冊
        </router-link>
      </div>
    </div>

    <!-- BaseAlertModal -->
    <BaseAlertModal
      :visible="alertModal.visible"
      :type="alertModal.type"
      :title="alertModal.title"
      :message="alertModal.message"
      :confirmText="alertModal.confirmText"
      @close="closeAlert"
    />
  </div>
</template>


<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore'
import BaseAlertModal from '@/components/common/BaseAlertModal.vue';

const authStore = useAuthStore();
const router = useRouter();

const isLogin = ref(true);
const showPassword = ref(false);

const loginForm = ref({
  email: '',
  password: ''
});

// 紀錄每個欄位是否有錯誤
const errors = ref({
  email: false,
  password: false
})

const emailErrorMessage = ref('')
const passwordErrorMessage = ref('')

const alertModal = ref({
  visible: false,
  type: 'default',
  title: '',
  message: '',
  confirmText: '確認'
})

const showAlert = (type, title, message, confirmText = '確認') => {
  alertModal.value = {
    visible: true,
    type,
    title,
    message,
    confirmText
  }
}

const closeAlert = () => {
  alertModal.value.visible = false
  if (alertModal.value.type === 'success' && alertModal.value.title.includes('登入成功')) {
    setTimeout(() => {
      router.push('/home')
    }, 300)
  }
}

const clearError = (fieldName) => {
  if (errors.value[fieldName]) {
    errors.value[fieldName] = false
    
    if (fieldName === 'email') {
      emailErrorMessage.value = ''
    } else if (fieldName === 'password') {
      passwordErrorMessage.value = ''
    }
  }
}

const validateEmail = (email) => {
  if (!email || email.trim() === '') {
    emailErrorMessage.value = '電子郵件為必填欄位'
    return false
  }
  
  if (!email.includes('@')) {
    emailErrorMessage.value = '電子郵件格式不正確，必須包含@符號'
    return false
  }
  
  const hasEnglish = /[a-zA-Z]/.test(email)
  if (!hasEnglish) {
    emailErrorMessage.value = '電子郵件必須包含英文字母'
    return false
  }
  
  return true
}

const validatePassword = (password) => {
  if (!password || password.trim() === '') {
    passwordErrorMessage.value = '密碼為必填欄位'
    return false
  }
  
  if (password.length < 8) {
    passwordErrorMessage.value = '密碼至少需要8個字元'
    return false
  }

  const hasEnglish = /[a-zA-Z]/.test(password)
  if (!hasEnglish) {
    passwordErrorMessage.value = '密碼必須包含英文字母'
    return false
  }
  
  const hasNumber = /\d/.test(password)
  if (!hasNumber) {
    passwordErrorMessage.value = '密碼必須包含數字'
    return false
  }
  
  return true
}

const handleEmailLogin = async () => {
  let valid = true

  if (!validateEmail(loginForm.value.email)) {
    errors.value.email = true
    valid = false
  } else {
    errors.value.email = false
  }

  if (!validatePassword(loginForm.value.password)) {
    errors.value.password = true
    valid = false
  } else {
    errors.value.password = false
  }

  if (!valid) return

  try {
    const result = await authStore.emailLogin(loginForm.value.email, loginForm.value.password);
    
    if (result.success) {
      showAlert('success', '登入成功', '歡迎回來！', '前往首頁')
      loginForm.value = { email: '', password: '' };
    } else {
      showAlert('error', '登入失敗', result.error)
    }
  } catch (error) {
    console.error('登入過程發生錯誤:', error);
    showAlert('error', '發生錯誤', '發生未知錯誤，請稍後再試')
  }
};

const handleLineLogin = async () => {
  const result = await authStore.lineLogin()
  if (!result.success) {
    showAlert('error', 'LINE 登入失敗', result.error)
  }
}

const useTestAccount = () => {
  loginForm.value.email = '123@example.com'
  loginForm.value.password = 'Test123456'

  errors.value.email = false
  errors.value.password = false

  showAlert('info', '測試帳號已填入', '已自動填入測試用的電子郵件和密碼')
}

// 組件掛載時檢查 LINE 登入狀態
onMounted(async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const isLineCallback = urlParams.get('success') || urlParams.get('error');

  if (isLineCallback) {
    console.log('處理 LINE 登入回調...');
    const result = await authStore.checkLineCallback();
    if (result?.success) {
      router.push(result.redirect);
    }
  } else {
    authStore.init();
  }
});
</script>

<style scoped>
</style>