<script setup>
defineProps({
  adImage: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-transparent ">
    <div class="relative bg-white rounded-2xl overflow-hidden shadow-lg max-w-md w-full">
      <button
        @click="$emit('close')"
        class="absolute top-3 right-4 bg-white text-black text-3xl font-bold w-8 h-8 rounded-full flex items-center justify-center transition duration-200"
        style="box-shadow: 0 0 0 transparent; transition: box-shadow 0.2s ease;"
        @mouseover="($event.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)')"
        @mouseleave="($event.target.style.boxShadow = '0 0 0 transparent')"
      >
        &times;
      </button>
      <img :src="adImage" alt="廣告" class="w-full h-auto object-cover" />
    </div>
  </div>
</template>