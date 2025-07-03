<script setup>
import { defineEmits } from 'vue';
import FormCreateDesktop from './FormCreateDesktop.vue';
import FormCreateMobile from './FormCreateMobile.vue';

const emit = defineEmits(['submit']);

const handleSubmit = (data) => {
  emit('submit', data);
};
</script>

<template>
  <!-- 桌面版 -->
  <div class="hidden md:block">
    <FormCreateDesktop @submit="handleSubmit" />
  </div>

  <!-- 手機版 -->
  <div class="block md:hidden">
    <FormCreateMobile @submit="handleSubmit" />
  </div>
</template>

<style scoped>

</style>