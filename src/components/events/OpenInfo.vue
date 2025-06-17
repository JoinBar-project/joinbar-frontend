<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  eventId: {
    type: [String, Number],
    required: true,
  },
})

const router = useRouter()

function goToInfo() {
  router.push(`/event/${props.eventId}`)
}
</script>

<template>
  <button @click="goToInfo" class="btn-open-form btn-edit open-info-btn">
    查看詳情
  </button>
</template>

<style scoped>
@reference "tailwindcss";

.btn-open-form {
  @apply flex justify-center mt-2 w-32 py-2 text-white rounded-2xl cursor-pointer transition-colors duration-200;
}

.btn-edit {
  background-color: #afb18c;
}

.open-info-btn:hover {
  background-color: #878a6a;
}
</style>
