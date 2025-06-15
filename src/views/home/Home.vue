<script setup>
const videoUrl = new URL('@/assets/homepage/JOINBAR-NOLOGO.mp4', import.meta.url).href
</script>

<template>
  <section class="hero">
    <video class="hero-bg-video" autoplay muted loop playsinline>
      <source :src="videoUrl" type="video/mp4" />
      您的瀏覽器不支援影片播放。
    </video>
    <div class="frosted-mask"></div>
    <div class="hero-content">
      <div class="hero-main-visual">
        <img src="/joinbar-logo.png" alt="joinbar-logo" />
        <h1>隨時隨地，想喝就揪吧</h1>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  text-align: center;
  position: relative;
  overflow: hidden;
  height: 100vh;
}
.hero-bg-video {
  position: absolute;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
}
.frosted-mask {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: 1;
}
.hero-content {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  position: relative;
  max-width: 600px;
  margin: 0 auto;
  z-index: 2;
}
.hero-main-visual {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  position: relative;
}
.hero-main-visual img {
  position: relative;
  z-index: 1;
}
.hero-main-visual h1 {
  font-size: 20px;
  position: relative;
  z-index: 2;
  color: white;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
}
</style>