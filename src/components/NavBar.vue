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

    <div class="mobile-menu" :class="{ 'open': isMobileMenuOpen }">
      <button @click="closeMobileMenu" class="close-btn">×</button>
      
      <div v-if="isAuthenticated" class="mobile-user-section">
        <div class="mobile-user-info" @click="goToMember">
          <UserAvatar 
            :avatar-url="avatarUrl"
            :display-name="user.username"
            size="md" />
          <div class="mobile-user-text">
            <span class="mobile-username">{{ user.username }}</span>
            <span class="mobile-user-subtitle">會員中心</span>
          </div>
        </div>
      </div>

      <ul class="mobile-nav-links">
        <li>
          <button @click="handleNavClick('/map')" class="mobile-nav-item">
            <i class="fas fa-map-marker-alt"></i>
            <span>酒吧地圖</span>
          </button>
        </li>
        <li>
          <button @click="handleNavClick('/event')" class="mobile-nav-item">
            <i class="fas fa-calendar-alt"></i>
            <span>酒吧活動</span>
          </button>
        </li>
        <li>
          <button @click="handleNavClick('/subscription')" class="mobile-nav-item">
            <i class="fas fa-star"></i>
            <span>訂閱優惠</span>
          </button>
        </li>
        <li>
          <button @click="handleNavClick('/cart')" class="mobile-nav-item">
            <i class="fas fa-shopping-cart"></i>
            <span>購物車</span>
          </button>
        </li>
        
        <li v-if="!isAuthenticated">
          <button @click="handleNavClick('/login')" class="mobile-nav-item login-item">
            <i class="fas fa-sign-in-alt"></i>
            <span>登入/註冊</span>
          </button>
        </li>
        
        <li v-if="isAuthenticated">
          <button @click="handleLogout" class="mobile-nav-item logout-item">
            <i class="fas fa-sign-out-alt"></i>
            <span>登出</span>
          </button>
        </li>
      </ul>
    </div>
  </nav>
</template>

<style scoped>
@reference "tailwindcss";

.navbar {
  @apply flex justify-between items-center px-8 py-4 text-white h-24;
  background-color: var(--color-black);
}

.logo img {
  @apply h-8 w-auto;
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
  z-index: 60;
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
  z-index: 40;
}

.mobile-menu {
  @apply fixed top-0 right-0 w-80 h-full bg-white text-black transform translate-x-full transition-transform duration-300 ease-in-out;
  z-index: 50;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
}

.mobile-menu.open {
  @apply translate-x-0;
}

.close-btn {
  @apply absolute top-4 right-4 w-8 h-8 bg-transparent border-none cursor-pointer text-2xl text-gray-600 hover:text-gray-800 z-10;
}

.mobile-user-section {
  @apply p-6 bg-gray-50 border-b border-gray-200;
}

.mobile-user-info {
  @apply flex items-center gap-4 cursor-pointer hover:bg-gray-100 p-3 rounded-lg transition-colors duration-200;
}

.mobile-user-text {
  @apply flex flex-col;
}

.mobile-username {
  @apply text-lg font-semibold text-gray-800;
}

.mobile-user-subtitle {
  @apply text-sm text-gray-500;
}

.mobile-nav-links {
  @apply list-none p-0 m-0 pt-4;
}

.mobile-nav-links li {
  @apply border-b border-gray-100 last:border-b-0;
}

.mobile-nav-item {
  @apply w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50 transition-colors duration-200 border-none bg-transparent cursor-pointer;
}

.mobile-nav-item i {
  @apply text-gray-600 w-5 text-center;
}

.mobile-nav-item span {
  @apply text-gray-800 font-medium;
}

.mobile-nav-item:hover i {
  @apply text-blue-600;
}

.mobile-nav-item:hover span {
  @apply text-blue-600;
}

.login-item {
  @apply bg-blue-50;
}

.login-item i,
.login-item span {
  @apply text-blue-600;
}

.logout-item:hover i,
.logout-item:hover span {
  @apply text-red-600;
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
}
</style>