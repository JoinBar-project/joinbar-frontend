import { createRouter, createWebHistory } from 'vue-router'

import Home from '@/views/home/Home.vue'
import Event from '@/views/events/Event.vue'
import EventInfo from '@/views/events/EventInfo.vue'
import MapView from '@/views/map/MapView.vue'
import Member from '@/views/member/auth/Member.vue'
import Reviews from '@/views/reviews/Reviews.vue'
import Subscription from '@/views/sub/Subscription.vue'
import Cart from '@/views/cart/Cart.vue'
import Payment from "@/views/cart/Payment.vue"
import OrderSuccess from '@/views/cart/OrderSuccess.vue'
import Login from "@/views/member/auth/Login.vue"
import Register from "@/views/member/auth/Register.vue"

const routes = [
  { path: '/home', name: 'Home', component: Home },
  { path: '/login', name: 'Login', component: Login },
  { path: '/register', name: 'Register', component: Register },
  { path: '/event', name: 'Event', component: Event },
  { path: '/event/:id', name: 'EventInformation', component: EventInfo },
  { path: '/map', name: 'Map', component: MapView },
  { path: '/member', name: 'Member', component: Member },
  { path: '/reviews', name: 'Reviews', component: Reviews },
  { path: '/subscription', name: 'Subscription', component: Subscription },
  { path: '/cart', name: 'Cart', component: Cart },
  { path: '/payment', name: 'Payment', component: Payment },
  { path: '/order-success/:orderNumber', name: 'OrderSuccess', component: OrderSuccess, props: true }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router