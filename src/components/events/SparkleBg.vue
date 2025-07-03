<template>
  <!-- 背景圖片層 -->
  <div
    class="pointer-events-none fixed inset-0 z-[-3] background-layer"
    :style="{ backgroundImage: `url(${backgroundImage})` }"
  />

  <!-- 模糊遮罩 -->
  <div class="pointer-events-none fixed inset-0 z-[-2] blur-vignette" />

  <!-- 閃爍粒子動畫（只在桌機顯示） -->
  <div class="pointer-events-none fixed inset-0 z-[-3] sparkle-particles" />
</template>

<script setup>
defineProps({
  backgroundImage: {
    type: String,
    required: true,
  },
})
</script>

<style>
.background-layer {
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.blur-vignette {
  backdrop-filter: blur(5px);
  background: radial-gradient(
    circle at center,
    transparent 0%,
    transparent 30%,
    rgba(0, 0, 0, 0.2) 60%,
    rgba(0, 0, 0, 0.6) 100%
  );
}

.sparkle-particles {
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  overflow: hidden;
  clip-path: inset(0);
}

/* ✅ 限定 md 以上裝置才有動畫 */
@media (min-width: 768px) {
  .sparkle-particles::after {
    content: '';
    position: absolute;
    inset: 0;
    animation: sparkleFlow 4s linear infinite;

    background-image:
      radial-gradient(3px 3px at 25px 35px, rgba(255, 215, 0, 0.9), transparent),
      radial-gradient(2px 2px at 60px 80px, rgba(255, 193, 7, 0.8), transparent),
      radial-gradient(2px 2px at 110px 45px, rgba(255, 165, 0, 0.7), transparent),
      radial-gradient(1px 1px at 140px 90px, rgba(255, 223, 186, 0.6), transparent),
      radial-gradient(2px 2px at 180px 120px, rgba(255, 215, 0, 0.5), transparent),
      radial-gradient(1px 1px at 220px 65px, rgba(255, 140, 0, 0.8), transparent),
      radial-gradient(3px 3px at 260px 100px, rgba(255, 215, 0, 0.6), transparent),
      radial-gradient(2px 2px at 300px 150px, rgba(255, 193, 7, 0.7), transparent);

    background-size:
      180px 180px, 220px 220px, 160px 160px, 200px 200px,
      240px 240px, 190px 190px, 210px 210px, 170px 170px;
  }
}

@keyframes sparkleFlow {
  0% {
    transform: translateX(0) translateY(0);
  }
  100% {
    transform: translateX(20px) translateY(20px);
  }
}
</style>