<script setup>
import NavBar from '@/components/NavBar.vue'
</script>

<template>
  <div>
    <NavBar />
    <router-view />
  </div>
</template>

<style>
body {
  margin: 0;
  font-family: Arial, sans-serif;
  overflow-x: hidden; /* 防止水平滾動條 */
}

.home {
  padding: 2rem;
  text-align: center;
}
</style>