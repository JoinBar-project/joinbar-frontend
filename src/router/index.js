import { createRouter, createWebHistory } from 'vue-router';

import Home from '@/views/home/Home.vue'
import Event from '@/views/events/Event.vue'
import EventInfo from '@/views/events/EventInfo.vue'
import MapView from '@/views/map/MapView.vue'
import Member from '@/views/member/auth/Member.vue'
import MemberDashboard from '@/views/member/MemberDashboard.vue';
import Reviews from '@/views/reviews/Reviews.vue'
import Subscription from '@/views/sub/Subscription.vue'
import Cart from '@/views/cart/Cart.vue'
import Payment from '@/views/cart/Payment.vue' 
import PaymentWaiting from '@/views/cart/PaymentWaiting.vue'
import OrderSuccess from '@/views/cart/OrderSuccess.vue'
import Login from "@/views/member/auth/Login.vue"
import Register from "@/views/member/auth/Register.vue"
import NotFound from '../views/NotFound.vue'

const routes = [
  { path: '/', redirect: '/home' },
  { path: '/home', name: 'Home', component: Home },
  { path: '/login', name: 'Login', component: Login },
  { path: '/register', name: 'Register', component: Register },
  { path: '/event', name: 'Event', component: Event },
  { path: '/event/:id', name: 'EventInformation', component: EventInfo },
  { path: '/map', name: 'Map', component: MapView },
  { path: '/member', name: 'Member', component: Member },
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
  { path: '/cart', name: 'Cart', component: Cart },
  { path: '/payment', name: 'Payment', component: Payment },
  { path: '/payment-waiting', name: 'PaymentWaiting', component: PaymentWaiting },
  { path: '/sub', name: 'EventInformation', component: EventInfo },
  { path: '/order-success/:orderNumber', name: 'OrderSuccess', component: OrderSuccess, props: true },
  // 404 路由放到最後，並且更精確
  { path: '/404', name: 'NotFound', component: NotFound },
  { 
    path: '/:pathMatch(.*)*', 
    name: 'Catch-All',
    component: NotFound,
    // 可以改成直接使用組件而不是 redirect，避免重複跳轉
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 添加路由守衛來調試
router.beforeEach((to, from, next) => {
  console.log('🔄 路由跳轉:', {
    from: from.path,
    to: to.path,
    query: to.query
  })
  next()
})

// 處理路由錯誤
router.onError((error) => {
  console.error('❌ 路由錯誤:', error)
})

export default router
