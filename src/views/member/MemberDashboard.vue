<script setup>
import MemberSideNavBar from '@/components/member/MemberSideNavBar.vue';
</script>

<template>
  <div class="flex min-h-screen">
    <MemberSideNavBar />

    <div class="flex-1 p-6 bg-white">
      <router-view />
    </div>
  </div>
</template>

<style scoped>
.page {
  padding: 2rem;
}
</style>
