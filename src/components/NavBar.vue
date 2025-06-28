<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore'; // 新增這行
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import UserAvatar from '@/components/UserAvatar.vue';
import Swal from 'sweetalert2';

const router = useRouter();
const authStore = useAuthStore();
const cartStore = useCartStore(); // 新增這行
const { user, isAuthenticated } = storeToRefs(authStore);

// 新增：計算購物車數量
const cartItemCount = computed(() => {
  const items = cartStore.items;
  
  if (items && typeof items === 'object' && 'items' in items) {
    return Array.isArray(items.items) ? items.items.length : 0;
  }
  
  if (Array.isArray(items)) {
    return items.length;
  }
  
  return 0;
});

const goToMember = () => {
  router.push({
    name: 'MemberProfile',
    params: { id: user.value.id },
  });
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
};

const avatarUrl = computed(() => {
  return user.value?.avatarUrl || '/default-user-avatar.png';
});
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
        <!-- 修改這部分：添加購物車徽章 -->
        <RouterLink to="/cart" class="cart-link-wrapper">
          <img class="cart-icon" src="/cart.png" alt="Cart Icon" />
          <span v-if="cartItemCount > 0" class="cart-badge">
            {{ cartItemCount > 99 ? '99+' : cartItemCount }}
          </span>
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
@reference "tailwindcss";

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

/* 新增：購物車徽章樣式 */
.cart-link-wrapper {
  @apply relative;
}

.cart-badge {
  position: absolute;
  top: 15px;
  right: 2px;
  background-color: #ef4444;
  color: white;
  font-size: 10px;
  font-weight: bold;
  border-radius: 50%;
  min-width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
  line-height: 1;
  z-index: 10;
}
</style>