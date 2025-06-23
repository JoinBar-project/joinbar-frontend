<script setup>
const props = defineProps({
  message: String
})
const emit = defineEmits(['close'])
</script>

<template>
  <div class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <div class="bg-white p-6 rounded-xl shadow-lg text-center w-[90%] max-w-md">
      <h2 class="text-2xl font-bold text-gray-800 mb-4">提醒</h2>
      <p class="text-gray-600 text-lg">{{ message }}</p>
    </div>
  </div>
</template>