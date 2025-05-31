import { createRouter, createWebHistory } from 'vue-router'

import Home from '@/views/home/Home.vue'
import Event from '@/views/events/Event.vue'
import Map from '@/views/map/Map.vue'
import Member from '@/views/member/Member.vue'
import Reviews from '@/views/reviews/Reviews.vue'
import Subscription from '@/views/sub/Subscription.vue'

const routes = [
  { path: '/home', name: 'Home', component: Home },
  { path: '/events', name: 'Event', component: Event },
  { path: '/map', name: 'Map', component: Map },
  { path: '/member', name: 'Member', component: Member },
  { path: '/reviews', name: 'Reviews', component: Reviews },
  { path: '/subscription', name: 'Subscription', component: Subscription },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
