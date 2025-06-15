<template>
  <div @click="onAvatarClick">
    <img :src="avatarUrl || defaultAvatar" alt="user-avatarURL" class="w-10 h-10 object-cover rounded-full border-2 border-white" />
    <span v-if="showName" class="text-sm">{{ displayName }}</span>
  </div>
</template>

<script setup>
const defaultAvatar = '/default-user-avatar.png';

defineProps({
  avatarUrl: String,
  displayName: String,
  showName: { type: Boolean, default: false },
  onAvatarClick: { type: Function, default: () => {} },
});
</script>
