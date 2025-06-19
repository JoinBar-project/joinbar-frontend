import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';

import Home from '@/views/home/Home.vue';
import Event from '@/views/events/Event.vue';
import EventInfo from '@/views/events/EventInfo.vue';
import MapView from '@/views/map/MapView.vue';
import Member from '@/views/member/auth/Member.vue';
import Reviews from '@/views/reviews/Reviews.vue';
import Subscription from '@/views/sub/Subscription.vue';
import Cart from '@/views/cart/Cart.vue';
import Payment from "@/views/cart/Payment.vue";
import OrderSuccess from '@/views/cart/OrderSuccess.vue';
import Login from "@/views/member/auth/Login.vue";
import Register from "@/views/member/auth/Register.vue";
import Preferences from '@/components/Preferences.vue';
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
  { path: '/reviews', name: 'Reviews', component: Reviews },
  { path: '/subscription', name: 'Subscription', component: Subscription, meta: { requiresAuth: true } },
  { path: '/cart', name: 'Cart', component: Cart, meta: { requiresAuth: true } },
  { path: '/payment', name: 'Payment', component: Payment, meta: { requiresAuth: true } },
  { path: '/order-success/:orderNumber', name: 'OrderSuccess', component: OrderSuccess, props: true, meta: { requiresAuth: true } },
  { path: '/preferences', name: 'Preferences', component: Preferences, meta: { requiresAuth: true } },
  { path: '/404', name: 'NotFound', component: NotFound },
  { path: '/:pathMatch(.*)*', redirect: '/404' }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  if (!authStore.user && !authStore.accessToken) {
    authStore.init();
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  } 
  else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next('/home');
  }
  else {
    next();
  }
});

export default router;