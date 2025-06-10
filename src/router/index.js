import { createRouter, createWebHistory } from 'vue-router'

import Home from '@/views/home/Home.vue'
import Event from '@/views/events/Event.vue'
import EventInfo from '@/views/events/EventInfo.vue'
import MapView from '@/views/map/MapView.vue'
import Member from '@/views/member/Member.vue'
import Reviews from '@/views/reviews/Reviews.vue'
import Subscription from '@/views/sub/Subscription.vue'
import Cart from '@/views/cart/Cart.vue'
import Payment from "@/views/cart/Payment.vue";

const routes = [
  { path: '/home', name: 'Home', component: Home },
  { path: '/event', name: 'Event', component: Event },
  { path: '/event/:id', name: 'EventInformation', component: EventInfo },
  { path: '/map', name: 'Map', component: MapView },
  { path: '/member', name: 'Member', component: Member },
  { path: '/reviews', name: 'Reviews', component: Reviews },
  { path: '/subscription', name: 'Subscription', component: Subscription },
  { path: '/cart', name: 'Cart', component: Cart },
  { path: '/payment', name: 'Payment', component: Payment }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
