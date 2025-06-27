<script setup>
import { ref, computed } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { storeToRefs } from 'pinia';
import Swal from 'sweetalert2';

const authStore = useAuthStore();
const { user } = storeToRefs(authStore);
const router = useRouter();

const userId = computed(() => user.value?.id);

const profileLink = computed(() => ({ name: 'MemberProfile', params: { id: userId.value } }));
const barLink = computed(() => ({ name: 'BarFavorites', params: { id: userId.value } }));
const memberCardLink = computed(() => ({ name: 'MemberCard', params: { id: userId.value } }));
const ordersLink = computed(() => ({ name: 'OrderRecords', params: { id: userId.value } }));

const selectedItem = ref('profile');
const expandedEventRecords = ref(null);

const menuItems = [
  { name: 'profile', label: '會員資料', icon: 'fa-user', to: profileLink },
  {
    name: 'event-records',
    label: '揪團活動紀錄',
    icon: 'fa-calendar',
    children: [
      { name: 'published', label: '我發布的活動', icon: 'fa-bullhorn', to: { name: 'PublishedEvents', params: { id: userId.value } } },
      { name: 'joined', label: '我參加的活動', icon: 'fa-calendar-check', to: { name: 'JoinedEvents', params: { id: userId.value } } }
    ]
  },
  { name: 'bar', label: '我的酒吧收藏', icon: 'fa-beer-mug-empty', to: barLink },
  { name: 'card', label: '酒友卡', icon: 'fa-id-card', to: memberCardLink },
  { name: 'orders', label: '訂單紀錄', icon: 'fa-receipt', to: ordersLink }
];

const handleMainMenuClick = (item) => {
  if (item.children) {
    toggleEventRecords(item.name);
  } else {
    selectedItem.value = item.name;
    router.push(item.to.value);
  }
};

const toggleEventRecords = (name) => {
  if (expandedEventRecords.value === name) {
    expandedEventRecords.value = null;
  } else {
    expandedEventRecords.value = name;
  }
};
const handleLogout = async () => {
  if (authStore.loginMethod === 'line') {
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
</script>

<template>
  <nav class="flex justify-center w-56 min-h-screen p-6 bg-gradient-to-b from-[#f5f5f5] to-[#dcdcdc]">
    <ul class="w-full space-y-1">
      <li v-for="item in menuItems" :key="item.name">
        <!-- 左側選單 -->
        <div
          @click="handleMainMenuClick(item)"
          :class="[
            'flex items-center justify-between p-2 rounded w-full cursor-pointer transition',
            selectedItem === item.name 
            ? 'bg-gray-200 text-black scale-[0.98]' 
            : 'hover:bg-gray-200 text-gray-700'
          ]">
          <div class="flex items-center gap-2">
            <i :class="['fa-solid', item.icon, 'w-4']" />
            <span>{{ item.label }}</span>
          </div>
          <i v-if="item.children"
            :class="['fa-solid fa-caret-down transition-transform duration-200', 
            expandedEventRecords === item.name 
            ? 'rotate-180' 
            : '']" />
        </div>

        <!-- 揪團活動紀錄的子選單 -->
        <div v-if="item.children && expandedEventRecords === item.name" class="px-2 py-2 mt-1 bg-[#e1ac6747] rounded-lg shadow-inner">
          <ul class="space-y-1">
            <li v-for="child in item.children" :key="child.name">
              <RouterLink
                :to="child.to"
                @click="selectedItem = child.name"
                :class="[
                  'flex items-center gap-2 px-4 py-2 rounded-md transition w-full text-sm text-gray-800',
                  selectedItem === child.name 
                  ? 'bg-[#d68c2c47] scale-[0.98] font-medium' 
                  : 'hover:bg-[#e4bc8747]'
                ]">
                <i :class="['fa-solid', child.icon, 'w-4']" />
                <span>{{ child.label }}</span>
              </RouterLink>
            </li>
          </ul>
        </div>
      </li>

      <li>
        <button @click="handleLogout" class="flex items-center w-full gap-2 p-2 text-black transition rounded cursor-pointer hover:bg-gray-200">
          <i class="w-4 fa-solid fa-arrow-right-from-bracket" />登出
        </button>
      </li>
    </ul>
  </nav>
</template>
