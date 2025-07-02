<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import UserAvatar from '@/components/UserAvatar.vue';
import Swal from 'sweetalert2';

const router = useRouter();
const authStore = useAuthStore();
const { user, isAuthenticated } = storeToRefs(authStore);

const isMobileMenuOpen = ref(false);

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false;
};

const goToMember = () => {
  router.push({
    name: 'MemberProfile',
    params: { id: user.value.id },
  });
  closeMobileMenu();
};

const handleLogout = async () => {
  if(authStore.loginMethod === 'line' ) {
    try {
      const result = await authStore.lineLogout();

      if (result.success) {
        await Swal.fire({
          title: '登出成功！',
          text: '您已安全登出，感謝使用',
          icon: 'success',
          confirmButtonText: '確認',
          timer: 1500,
          timerProgressBar: true
        });
        router.push('/login');
      }
    } catch (error) {
      console.error('登出失敗:', error);
      await Swal.fire({
        title: '登出失敗',
        text: '請稍後再試',
        icon: 'error',
        confirmButtonText: '確認'
      });
    }
  } else {
    try {
      const result = await authStore.logout();

      if (result.success) {
        await Swal.fire({
          title: '登出成功！',
          text: '您已安全登出，感謝使用',
          icon: 'success',
          confirmButtonText: '確認',
          timer: 1500,
          timerProgressBar: true
        });
        router.push('/login');
      }
    } catch (error) {
      console.error('登出失敗:', error);
      await Swal.fire({
        title: '登出失敗',
        text: '請稍後再試',
        icon: 'error',
        confirmButtonText: '確認'
      });
    }
  }
  closeMobileMenu();
};

const avatarUrl = computed(() => {
  return user.value?.avatarUrl || '/default-user-avatar.png';
});

const handleNavClick = (path) => {
  router.push(path);
  closeMobileMenu();
};
</script>

<template>
  <nav class="navbar">
    <div class="logo">
      <RouterLink to="/home">
        <img src="/joinbar-logo.png" alt="JoinBar Logo" />
      </RouterLink>
    </div>
    
    <ul class="nav-links">
      <li><RouterLink to="/map">酒吧地圖</RouterLink></li>
      <li><RouterLink to="/event">酒吧活動</RouterLink></li>
      <li><RouterLink to="/subscription">訂閱優惠</RouterLink></li>
      <li>
        <div v-if="isAuthenticated" class="flex flex-col items-center gap-1 cursor-pointer">
          <UserAvatar 
          :avatar-url="avatarUrl"
          :display-name="user.username"
          size="sm"
          :on-avatar-click="goToMember" />
          <span class="text-sm">嗨！{{ user.username }}</span>
        </div>
        <RouterLink v-else to="/login">登入/註冊</RouterLink>
      </li>
      <li>
        <div
          @click="handleLogout"
          v-if="isAuthenticated"
          class="flex flex-col items-center gap-1 cursor-pointer logout-button">
          <span>登出</span>
        </div>
      </li>
      <li>
        <RouterLink to="/cart"><img class="cart-icon" src="/cart.png" alt="Cart Icon" /></RouterLink>
      </li>
    </ul>

    <button 
      @click="toggleMobileMenu" 
      class="hamburger-btn"
      :class="{ 'active': isMobileMenuOpen }">
      <span></span>
      <span></span>
      <span></span>
    </button>

    <div 
      v-if="isMobileMenuOpen" 
      class="mobile-overlay"
      @click="closeMobileMenu">
    </div>

    <!-- 更新的手機版側邊欄 -->
    <div class="mobile-menu" :class="{ 'open': isMobileMenuOpen }">
      <button @click="closeMobileMenu" class="close-btn">×</button>
      
      <!-- 用戶頭像和資訊區域 -->
      <div v-if="isAuthenticated" class="mobile-user-section">
        <div class="mobile-user-avatar-container" @click="goToMember">
          <div class="mobile-user-avatar">
            <UserAvatar 
              :avatar-url="avatarUrl"
              :display-name="user.username"
              size="md" />
          </div>
          <div class="hover-tooltip">會員中心</div>
        </div>
        <div class="mobile-username">{{ user.username }}</div>
      </div>

      <!-- 登入提示區域（未登入時） -->
      <div v-else class="mobile-login-section">
        <div class="mobile-login-avatar">
          <div class="default-avatar"></div>
        </div>
        <button @click="handleNavClick('/login')" class="mobile-login-text">點擊登入</button>
      </div>

      <!-- 導航菜單 -->
      <ul class="mobile-nav-links">
        <li>
          <button @click="handleNavClick('/map')" class="mobile-nav-item">
            <i class="fas fa-map-marker-alt mobile-nav-icon"></i>
            <span>酒吧地圖</span>
          </button>
        </li>
        <li>
          <button @click="handleNavClick('/event')" class="mobile-nav-item">
            <i class="fas fa-calendar-alt mobile-nav-icon"></i>
            <span>酒吧活動</span>
          </button>
        </li>
        <li>
          <button @click="handleNavClick('/subscription')" class="mobile-nav-item">
            <i class="fas fa-star mobile-nav-icon"></i>
            <span>訂閱優惠</span>
          </button>
        </li>
        <li>
          <button @click="handleNavClick('/cart')" class="mobile-nav-item">
            <i class="fas fa-shopping-cart mobile-nav-icon"></i>
            <span>購物車</span>
          </button>
        </li>
        
        <li v-if="isAuthenticated">
          <button @click="handleLogout" class="mobile-nav-item logout-item">
            <i class="fas fa-sign-out-alt mobile-nav-icon"></i>
            <span>登出</span>
          </button>
        </li>
      </ul>
    </div>
  </nav>
</template>

<style scoped>
@import "tailwindcss";

.navbar {
  @apply flex justify-between items-center px-8 py-4 text-white h-24;
  background-color: var(--color-black);
}

.logo img {
  @apply h-12 w-auto;
}

.nav-links {
  @apply list-none flex gap-6 items-center h-full;
}

.nav-links li {
  @apply flex items-center h-full;
}

.nav-links a {
  @apply text-white no-underline flex items-center h-full;
}

.cart-icon {
  @apply h-[55%] w-auto block;
}

.logout-button {
  @apply hover:text-gray-300 transition-colors duration-200;
}

.hamburger-btn {
  @apply hidden relative w-8 h-8 flex-col justify-center items-center cursor-pointer bg-transparent border-none;
  z-index: 2000;
}

.hamburger-btn span {
  @apply block w-6 h-0.5 bg-white transition-all duration-300 ease-in-out;
  margin: 2px 0;
}

.hamburger-btn.active span:nth-child(1) {
  transform: rotate(45deg) translate(5px, 5px);
}

.hamburger-btn.active span:nth-child(2) {
  @apply opacity-0;
}

.hamburger-btn.active span:nth-child(3) {
  transform: rotate(-45deg) translate(7px, -6px);
}

.mobile-overlay {
  @apply fixed inset-0 bg-black;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1990;
}

/* 更新的手機版側邊欄樣式 */
.mobile-menu {
  @apply fixed top-0 right-0 h-full bg-white text-black transform translate-x-full transition-transform duration-300 ease-in-out;
  width: 60vw;
  z-index: 1995;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
}

.mobile-menu.open {
  @apply translate-x-0;
}

.close-btn {
  @apply absolute top-4 right-4 w-8 h-8 bg-transparent border-none cursor-pointer text-2xl text-gray-400 hover:text-gray-600;
  z-index: 1999;
}

/* 用戶區域樣式 */
.mobile-user-section {
  @apply flex flex-col items-center pt-8 pb-3 px-6;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.mobile-user-avatar-container {
  @apply relative mb-2 cursor-pointer;
}

.mobile-user-avatar {
  @apply transition-transform duration-200 hover:scale-105;
}

.hover-tooltip {
  @apply absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 transition-opacity duration-200 whitespace-nowrap;
  pointer-events: none;
}

.mobile-user-avatar-container:hover .hover-tooltip {
  @apply opacity-100;
}

.mobile-username {
  @apply text-lg font-semibold text-gray-800 text-center;
}

/* 登入區域樣式 */
.mobile-login-section {
  @apply flex flex-col items-center pt-8 pb-3 px-6;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.mobile-login-avatar {
  @apply mb-2;
}

.default-avatar {
  @apply w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23999"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>');
  background-size: 60%;
  background-repeat: no-repeat;
  background-position: center;
}

.mobile-login-text {
  @apply text-lg font-medium text-gray-600 bg-transparent border-none cursor-pointer hover:text-gray-800 transition-colors duration-200;
}

/* 導航菜單樣式 */
.mobile-nav-links {
  @apply list-none p-0 m-0 flex-1;
}

.mobile-nav-links li {
  @apply border-b border-gray-100 last:border-b-0;
}

.mobile-nav-item {
  @apply w-full flex items-center gap-4 px-4 py-4 text-left hover:bg-gray-50 transition-colors duration-200 border-none bg-transparent cursor-pointer;
  padding-right: 12px;
}

.mobile-nav-icon {
  @apply text-gray-500 w-5 text-center text-lg;
}

.mobile-nav-item span {
  @apply text-gray-700 font-medium text-base;
}

.mobile-nav-item:hover .mobile-nav-icon {
  @apply text-blue-500;
}

.mobile-nav-item:hover span {
  @apply text-blue-500;
}

.logout-item:hover .mobile-nav-icon,
.logout-item:hover span {
  @apply text-red-500;
}

@media (max-width: 767px) {
  .navbar {
    @apply px-4;
  }
  
  .nav-links {
    @apply hidden;
  }
  
  .hamburger-btn {
    @apply flex;
  }
}</style>