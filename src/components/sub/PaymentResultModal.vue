<script setup>

defineProps({
  modalMessage: Object
});

</script>

<template>
  <div class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
    <div class="bg-white p-8 rounded-2xl text-center shadow-lg max-w-sm w-full">
      <h2 class="text-3xl font-bold mb-6 text-gray-800">
        {{ modalMessage.title }}
      </h2>
      <p class="text-gray-600 mb-6">
        {{ modalMessage.message }}
      </p>
      <button
        class="bg-black text-white px-6 py-2 rounded-xl hover:bg-gray-800 transition"
      >
        關閉
      </button>
    </div>
  </div>
</template>


