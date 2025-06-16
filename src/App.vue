<script setup>
import NavBar from '@/components/NavBar.vue'
import Footer from '@/components/Footer.vue'
</script>

<template>
  <div>
    <NavBar />
    <router-view />
    <Footer />
  </div>
</template>

<style>
body {
  margin: 0;
  font-family: Arial, sans-serif;
  overflow-x: hidden;
  padding-bottom: 200px;
}

.home {
  padding: 2rem;
  text-align: center;
}
</style>