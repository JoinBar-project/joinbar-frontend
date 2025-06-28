import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';

import Home from '@/views/home/Home.vue';
import Event from '@/views/events/Event.vue';
import EventInfo from '@/views/events/EventInfo.vue';
import MapView from '@/views/map/MapView.vue';
import Member from '@/views/member/auth/Member.vue';
import MemberDashboard from '@/views/member/MemberDashboard.vue';
import Subscription from '@/views/sub/Subscription.vue';
import Cart from '@/views/cart/Cart.vue';
import Payment from '@/views/cart/Payment.vue';
import PaymentWaiting from '@/views/cart/PaymentWaiting.vue';
import OrderSuccess from '@/views/cart/OrderSuccess.vue';
import Login from '@/views/member/auth/Login.vue';
import Register from '@/views/member/auth/Register.vue';
import Preferences from '@/components/Preferences.vue';
import EmailVerify from '@/views/member/auth/EmailVerify.vue';
import NotFound from '../views/NotFound.vue';

const routes = [
  { path: '/', redirect: '/home' },
  { path: '/home', name: 'Home', component: Home },
  { path: '/login', name: 'Login', component: Login, meta: { requiresGuest: true } },
  { path: '/register', name: 'Register', component: Register, meta: { requiresGuest: true } },
  { path: '/event', name: 'Event', component: Event },
  { path: '/event/:id', name: 'EventInformation', component: EventInfo },
  { path: '/map', name: 'Map', component: MapView },
  { path: '/member', name: 'Member', component: Member, meta: { requiresAuth: true } },
  {
    path: '/member/:id',
    name: 'MemberDashboard',
    meta: { requiresAuth: true },
    component: MemberDashboard,
    children: [
      {
        path: 'profile',
        name: 'MemberProfile',
        component: () => import('@/views/member/profile/Profile.vue'),
      },
      {
        path: 'profile/edit',
        name: 'ProfileEdit',
        component: () => import('@/views/member/profile/ProfileEdit.vue'),
      },
      {
        path: 'event-records/published',
        name: 'PublishedEvents',
        component: () => import('@/views/member/profile/PublishedEvents.vue'),
      },
      {
        path: 'event-records/joined',
        name: 'JoinedEvents',
        component: () => import('@/views/member/profile/JoinedEvent.vue'),
      },
      {
        path: 'bar-favorites',
        name: 'BarFavorites',
        component: () => import('@/views/member/profile/BarFavorites.vue'),
      },
      {
        path: 'member-card',
        name: 'MemberCard',
        component: () => import('@/views/member/profile/MemberCard.vue'),
      },
      {
        path: 'order-records',
        name: 'OrderRecords',
        component: () => import('@/views/member/profile/OrderRecords.vue'),
      },
    ],
  },
  { path: '/subscription', name: 'Subscription', component: Subscription },
  { path: '/cart', name: 'Cart', component: Cart, meta: { requiresAuth: true } },
  { path: '/payment', name: 'Payment', component: Payment, meta: { requiresAuth: true } },
  { path: '/payment-waiting', name: 'PaymentWaiting', component: PaymentWaiting },
  { path: '/order-success/:orderNumber', name: 'OrderSuccess', component: OrderSuccess, props: true },
  { path: '/preferences', name: 'Preferences', component: Preferences, meta: { requiresAuth: true } },
  { path: '/verify-email', name: 'EmailVerify', component: EmailVerify, meta: { requiresGuest: true } },
  { path: '/404', name: 'NotFound', component: NotFound },
  {
    path: '/:pathMatch(.*)*',
    name: 'Catch-All',
    component: NotFound,
  },
  { 
    path: '/payment-result', 
    name: 'PaymentResult', 
    component: () => import('@/components/sub/PaymentResultModal.vue'),
    meta: { requiresAuth: true }
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

const hasUserCookie = () => {
  try {
    const userInfoCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('user_info='))
      ?.split('=')
      .slice(1)
      .join('=');
    
    if (userInfoCookie) {
      const userData = JSON.parse(decodeURIComponent(userInfoCookie));
      return userData && userData.id;
    }
  } catch (error) {
    console.error('檢查用戶 cookie 失敗:', error);
  }
  return false;
};

router.beforeEach(async (to, from, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('路由跳轉:', {
      from: from.path,
      to: to.path,
      query: to.query,
      params: to.params
    });
  }

  const authStore = useAuthStore();
  
  // LINE 登入回調檢測
  const urlParams = new URLSearchParams(window.location.search);
  const isLineCallback = urlParams.get('success') || urlParams.get('error');

  // 如果是 LINE 登入回調，先處理完登入邏輯再繼續
  if (isLineCallback && to.path === '/login') {
    console.log('LINE 登入回調偵測，跳過路由守衛');
    next();
    return;
  }

  // 確保 authStore 已初始化
  if (!authStore.user && !authStore.accessToken) {
    console.log('初始化 authStore');
    authStore.init();
    
    // 如果初始化後仍沒有用戶資訊，但有 cookie，等待一下讓狀態同步
    if (!authStore.user && hasUserCookie()) {
      console.log('檢測到用戶 cookie，等待狀態同步...');
      // 給一個短暫的時間讓 authStore.init() 完成 cookie 解析
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  // === 處理需要認證的路由 ===
  if (to.meta.requiresAuth) {
    const hasCookie = hasUserCookie();
    const isAuthenticated = authStore.isAuthenticated;
    
    console.log('認證檢查:', { 
      route: to.name, 
      isAuthenticated, 
      hasCookie, 
      hasUser: !!authStore.user 
    });

    // 沒有認證且沒有 cookie
    if (!isAuthenticated && !hasCookie) {
      console.log('需要登入，重導向到登入頁');
      next('/login');
      return;
    }
    
    // 有 cookie 但還沒同步到 authStore
    if (!isAuthenticated && hasCookie) {
      console.log('發現用戶 cookie，重新初始化 authStore');
      authStore.init();
      // 等待狀態同步
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 同步後再次檢查
      if (!authStore.isAuthenticated) {
        console.log('同步後仍未認證，跳轉到登入頁');
        next('/login');
        return;
      }
    }
    
    if (to.name === 'MemberDashboard' || to.name?.toString().startsWith('Member')) {
      const urlUserId = to.params.id;
      const currentUserId = authStore.user?.id;
      
      console.log('會員頁面 ID 驗證:', { urlUserId, currentUserId });
      
      // 沒有用戶 ID 但有用戶資訊，自動補充
      if (!urlUserId && currentUserId) {
        console.log('補充用戶 ID 參數');
        next(`/member/${currentUserId}/profile`);
        return;
      }
      
      // ID 不匹配，導向正確的頁面
      if (urlUserId && currentUserId && urlUserId !== currentUserId.toString()) {
        console.log('用戶 ID 不匹配，重導向到正確的會員頁面');
        next(`/member/${currentUserId}/profile`);
        return;
      }
      
      // 沒有用戶資訊，可能同步失敗
      if (!currentUserId) {
        console.log('無法取得用戶 ID，跳轉到登入頁');
        next('/login');
        return;
      }
    }
    
    // 沒有認證，跳轉到登入頁
    if (!authStore.isAuthenticated) {
      console.log('最終認證檢查失敗，跳轉到登入頁');
      next('/login');
      return;
    }
  }

  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    console.log('已登入用戶，重導向到首頁');
    next('/home');
    return;
  }

  console.log('路由守衛檢查完成，允許導航');
  next();
});

router.onError((error) => {
  console.error('路由錯誤:', error);
});

export default router;
