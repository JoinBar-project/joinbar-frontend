<script setup>
import Navbar from '@/components/Navbar.vue'
</script>

<template>
  <div>
    <Navbar />
    <router-view />
  </div>
</template>

<style>
body {
  margin: 0;
  font-family: Arial, sans-serif;
}

.home {
  padding: 2rem;
  text-align: center;
}
</style>