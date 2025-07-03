<script setup>
import MemberSideNavBar from '@/components/member/MemberSideNavBar.vue';
</script>

<template>
  <div class="hidden md:flex min-h-screen">
    <MemberSideNavBar />
    <div class="flex-1 p-6 bg-white">
      <router-view />
    </div>
  </div>

  <div class="md:hidden">
    <MemberSideNavBar />
    
    <div class="p-4 bg-white min-h-screen">
      <router-view />
    </div>
  </div>
</template>

<style scoped>
.page {
  padding: 2rem;
}
</style>