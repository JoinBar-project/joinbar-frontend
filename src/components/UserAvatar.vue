<script setup>
const defaultAvatar = '/default-user-avatar.png';
const sizeClass = {
  sm: 'w-8 h-8',
  md: 'w-32 h-32',
  lg: 'w-48 h-48',
};

defineProps({
  avatarUrl: String,
  displayName: String,
  size: {
    type: String,
    default: 'sm',
  },
  onAvatarClick: { type: Function, default: () => {} },
});
</script>

<template>
  <div @click="onAvatarClick" :class="[sizeClass[size],'aspect-square rounded-full overflow-hidden border-2 border-white cursor-pointer']">
    <img
      :src="avatarUrl || defaultAvatar"
      alt="user-avatarUrl"
      class="object-cover w-full h-full" />
  </div>
</template>
