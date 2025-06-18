<script setup>
const defaultAvatar = '/default-user-avatar.png';
const sizeClass = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
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
  <div @click="onAvatarClick">
    <img
      :src="avatarUrl || defaultAvatar"
      alt="user-avatarURL"
      :class="[sizeClass[size], 'object-cover rounded-full border-2 border-white']" />
  </div>
</template>
