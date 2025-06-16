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
      <button @click="$emit('close')" class="absolute top-3 right-4 text-gray-700 hover:text-black text-xl font-bold">
        &times;
      </button>
      <img :src="adImage" alt="廣告" class="w-full h-auto object-cover" />
    </div>
  </div>
</template>