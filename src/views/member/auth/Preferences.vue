<template>
  <div class="flex justify-center items-start pt-6 md:pt-10 px-4 min-h-[calc(100vh-6rem)]">
    <div class="relative w-full max-w-[424px] md:max-w-[500px] mx-auto p-4 md:p-6 bg-[var(--color-black)] rounded-xl shadow-xl">
    
      <!-- 成功提示 -->
      <transition name="alert-slide">
        <div v-if="showSuccess" role="alert" class="alert alert-success alert-soft absolute -top-8 left-0 right-0 z-10">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>偏好設定已儲存！</span>
        </div>
      </transition>
    
      <!-- 標題區域 -->
      <div class="flex border-b border-[var(--color-icon-secondary)] mb-6">
        <div class="flex-1 py-2 text-center font-semibold border-b-3 border-[var(--color-secondary-green)] text-[var(--color-secondary-green)]">
          酒吧偏好設定
        </div>
      </div>

      <!-- 歡迎訊息 -->
      <div class="text-center mb-6 md:mb-8">
        <div class="mb-3 md:mb-4">
          <i class="fa-solid fa-cocktail text-3xl md:text-4xl text-[var(--color-primary-orange)]"></i>
        </div>
        <h1 class="text-lg md:text-xl font-bold text-[var(--color-primary-orange)] mb-2">
          {{ isFirstTime ? '歡迎加入 JoinBar！' : '調整偏好設定' }}
        </h1>
        <p class="text-sm text-[var(--color-secondary-green)] px-2">
          {{ welcomeMessage }}
        </p>
      </div>

      <!-- 偏好設定表單 -->
      <div class="space-y-5">
        <!-- 酒吧類型選擇 -->
        <div>
          <h3 class="text-base font-semibold mb-3 text-[var(--color-secondary-green)]">
            選擇你喜歡的酒吧類型
          </h3>
          <!-- 手機版 2 列，桌面版 3 列 -->
          <div class="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
            <button 
              v-for="type in barTypes" 
              :key="type.key"
              @click="toggleSelection(preferences.types, type.key)"
              :class="[
                'text-xs md:text-sm py-3 px-2 rounded-lg border transition-all duration-200 flex flex-col items-center justify-center min-h-[75px] md:min-h-[80px] hover:scale-105',
                preferences.types.includes(type.key)
                  ? 'bg-[var(--color-primary-orange)] text-white border-[var(--color-primary-orange)] shadow-md'
                  : 'bg-[var(--color-icon-secondary)] text-[var(--color-black)] border-[var(--color-icon-secondary)] hover:bg-gray-300'
              ]">
              <i :class="type.icon + ' text-base md:text-lg mb-1'"></i>
              <span class="text-center leading-tight font-medium">{{ type.label }}</span>
            </button>
          </div>
        </div>

        <!-- 分隔線 -->
        <div class="flex items-center my-4">
          <div class="flex-grow h-px bg-gray-300"></div>
          <span class="px-4 text-gray-300 text-sm">和</span>
          <div class="flex-grow h-px bg-gray-300"></div>
        </div>

        <!-- 酒吧氛圍選擇 -->
        <div>
          <h3 class="text-base font-semibold mb-3 text-[var(--color-secondary-green)]">
            選擇你喜歡的酒吧氛圍
          </h3>
          <!-- 手機版 2 列，桌面版 3 列 -->
          <div class="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
            <button 
              v-for="mood in barMoods" 
              :key="mood.key"
              @click="toggleSelection(preferences.moods, mood.key)"
              :class="[
                'text-xs md:text-sm py-3 px-2 rounded-lg border transition-all duration-200 flex flex-col items-center justify-center min-h-[75px] md:min-h-[80px] hover:scale-105',
                preferences.moods.includes(mood.key)
                  ? 'bg-[var(--color-primary-orange)] text-white border-[var(--color-primary-orange)] shadow-md'
                  : 'bg-[var(--color-icon-secondary)] text-[var(--color-black)] border-[var(--color-icon-secondary)] hover:bg-gray-300'
              ]">
              <i :class="mood.icon + ' text-base md:text-lg mb-1'"></i>
              <span class="text-center leading-tight font-medium">{{ mood.label }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 主要操作按鈕 -->
      <div class="flex justify-center mt-6">
        <button
          @click="handleSavePreferences"
          :disabled="isLoading"
          class="w-full max-w-[200px] py-2 bg-gradient-to-r from-[var(--color-secondary-green)] via-[#d8dbaf] to-[var(--color-primary-orange)] text-[var(--color-black)] rounded-lg font-semibold shadow-md transition duration-300 transform hover:scale-105 hover:brightness-110 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
          <span v-if="isLoading" class="flex items-center justify-center">
            <i class="fa-solid fa-spinner fa-spin mr-2"></i>
            儲存中...
          </span>
          <span v-else>
            {{ isFirstTime ? '完成設定' : '儲存變更' }}
          </span>
        </button>
      </div>

      <!-- 跳過按鈕 -->
      <div v-if="isFirstTime" class="text-center mt-2 text-sm text-[var(--color-primary-orange)] underline underline-offset-4 cursor-pointer hover:text-[var(--color-secondary-green)] transition"
            @click="skipPreferences">
        暫時跳過
      </div>

      <!-- 底部說明 -->
      <div class="text-center mt-4 pt-4 border-t border-gray-300">
        <p class="text-xs text-gray-300 px-4">
          💡 {{ isFirstTime ? '您可以隨時在個人設定中修改這些偏好' : '修改後會立即更新您的推薦結果' }}
        </p>
        <div v-if="!isFirstTime" class="mt-2">
          <button
            @click="skipPreferences"
            class="text-sm text-[var(--color-secondary-green)] hover:underline underline-offset-4">
            返回上一頁
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
/* 通知動畫 (與 login 頁面一致) */
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

@media (max-width: 767px) {
  button {
    min-height: 44px;
  }
}
</style>