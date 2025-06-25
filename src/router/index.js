import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';

import Home from '@/views/home/Home.vue';
import Event from '@/views/events/Event.vue';
import EventInfo from '@/views/events/EventInfo.vue';
import MapView from '@/views/map/MapView.vue';
import Member from '@/views/member/auth/Member.vue';
import MemberDashboard from '@/views/member/MemberDashboard.vue';
import Reviews from '@/views/reviews/Reviews.vue';
import Subscription from '@/views/sub/Subscription.vue';
import Cart from '@/views/cart/Cart.vue';
import Payment from "@/views/cart/Payment.vue";
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
    // meta: { requiresAuth: true },
    component: MemberDashboard,
    children: [
      {
        path: 'profile',
        name: 'MemberProfile',
        component: () => import('@/views/member/profile/Profile.vue'),
      },
      {
        path: 'profile/edit',
        name: 'MemberProfileEdit',
        component: () => import('@/views/member/profile/ProfileEdit.vue'),
      },
      {
        path: 'event-records',
        name: 'MemberEventRecords',
        component: () => import('@/views/member/profile/EventRecords.vue'),
      },
      {
        path: 'bar-favorites',
        name: 'MemberBarFavorites',
        component: () => import('@/views/member/profile/BarFavorites.vue'),
      },
      {
        path: 'membercard',
        name: 'MemberCard',
        component: () => import('@/views/member/profile/MemberCard.vue'),
      },
      {
        path: 'order-records',
        name: 'MemberOrderRecords',
        component: () => import('@/views/member/profile/OrderRecords.vue'),
      },
    ],
  },
  { path: '/reviews', name: 'Reviews', component: Reviews },
  { path: '/subscription', name: 'Subscription', component: Subscription },
  { path: '/cart', name: 'Cart', component: Cart, meta: { requiresAuth: true } },
  { path: '/payment', name: 'Payment', component: Payment, meta: { requiresAuth: true } },
  { path: '/payment-waiting', name: 'PaymentWaiting', component: PaymentWaiting },
  { path: '/order-success/:orderNumber', name: 'OrderSuccess', component: OrderSuccess, props: true, meta: { requiresAuth: true } },
  { path: '/preferences', name: 'Preferences', component: Preferences, meta: { requiresAuth: true } },
  { path: '/verify-email', name: 'EmailVerify', component: EmailVerify, meta: { requiresGuest: true } },
  // 404 路由放到最後，並且更精確
  { path: '/404', name: 'NotFound', component: NotFound },
  { 
    path: '/:pathMatch(.*)*', 
    name: 'Catch-All',
    component: NotFound,
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('路由跳轉:', {
      from: from.path,
      to: to.path,
      query: to.query
    });
  }

  const authStore = useAuthStore();
  
  const urlParams = new URLSearchParams(window.location.search);
  const isLineCallback = urlParams.get('success') || urlParams.get('error');

  if (isLineCallback && to.path === '/login') {
    console.log('LINE 登入回調偵測，跳過路由守衛初始化');
    next();
    return;
  }

  if (!authStore.user && !authStore.accessToken) {
    authStore.init();
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    console.log('需要登入，重導向到登入頁');
    next('/login');
  } 

  else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    console.log('已登入用戶，重導向到首頁');
    next('/home');
  }
  else {
    next();
  }
});

router.onError((error) => {
  console.error('❌ 路由錯誤:', error);
});

export default router;