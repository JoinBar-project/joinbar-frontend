<template>
  <nav class="w-64 bg-gray-100 p-6 min-h-screen flex justify-center">
    <ul class="space-y-1">
      <li><RouterLink :to="profileLink">會員資料</RouterLink></li>
      <li><RouterLink :to="eventLink">揪團活動紀錄</RouterLink></li>
      <li><RouterLink :to="barLink">我的酒吧收藏</RouterLink></li>
      <li><RouterLink :to="ordersLink">訂單紀錄</RouterLink></li>
    </ul>
  </nav>
</template>

<script setup>
import { RouterLink, useRoute } from 'vue-router';
const route = useRoute();
const id = route.params.id 

const profileLink = { name: 'MemberProfile', params: { id } };
const eventLink = { name: 'MemberEventRecords', params: { id } };
const barLink = { name: 'MemberBarFavorites', params: { id } };
const ordersLink = { name: 'MemberOrderRecords', params: { id } };
</script>

