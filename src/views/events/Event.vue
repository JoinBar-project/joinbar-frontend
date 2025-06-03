<script setup>
// import FormModal from '@/components/events/FormModal.vue'
import EventInfoFree from '@/components/events/EventInfoFree.vue'





</script>

<template>

  <div class="page">
    <h1>酒吧活動</h1>
    <p>參加近期活動，結識朋友！</p>
    <p>探索附近的酒吧活動。</p>
  </div>

  <!-- <FormModal /> -->
  <EventInfoFree />



</template>


<style scoped>
.page {
  padding: 2rem;
  text-align: center;
  background-color: var(--color-black);
  color: white;
}
</style>