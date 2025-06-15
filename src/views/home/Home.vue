<script setup>

const videoUrl = new URL('@/assets/homepage/JOINBAR-NOLOGO.mp4', import.meta.url).href

const bars = [
  {
    name: "The Alchemist's Corner",
    desc: "神秘的燈光與獨創調酒。",
    image: new URL('@/assets/homepage/bar-1.jpg', import.meta.url).href
  },
  {
    name: "Sunset Vista Rooftop",
    desc: "城市天際線下的微醺時光。",
    image: new URL('@/assets/homepage/bar-2.jpg', import.meta.url).href
  },
  {
    name: "Liquid Artistry",
    desc: "欣賞調酒師的指尖魔法。",
    image: new URL('@/assets/homepage/bar-3.jpg', import.meta.url).href
  },
  {
    name: "The Cozy Barrel",
    desc: "溫馨舒適的週末好去處。",
    image: new URL('@/assets/homepage/bar-4.jpg', import.meta.url).href
  }
]

</script>

<template>

  <section class="hero">
  <video class="hero-bg-video" autoplay muted loop playsinline>
    <source :src="videoUrl" type="video/mp4">
    您的瀏覽器不支援影片播放。
  </video>
  <div class="frosted-mask"></div>
  <div class="hero-content">
    <div class="hero-main-visual">
      <img src="/joinbar-logo.png" alt="joinbar-logo">
      <h1>隨時隨地，想喝就揪吧</h1>
    </div>
  </div>
  </section>

  <section id="features" class="features-section">
    <div class="section-number-bg num-1">1</div>
    <h2>JoinBar 為你串連酒吧、活動與朋友</h2>
    <div class="features-grid">
      <div class="feature-card large-feature">
        <img src="/wine.gif" alt="JoinBar Logo">
        <h3>社群活動</h3>
        <p>參與我們舉辦的品酒會、派對等精彩活動。</p>
      </div>
      <div class="feature-card">
        <img src="/google-maps.gif">
        <h3>酒吧地圖</h3>
      </div>
      <div class="feature-card">
        <img src="/fireworks-.gif">
        <h3>訂閱優惠</h3>
      </div>
      <div class="feature-card">
        <img src="/interaction.gif">
        <h3>用戶評論</h3>
      </div>
      <div class="feature-card">
        <img src="/social-care.gif">
        <h3>會員服務</h3>
      </div>
    </div>
  </section>

  <section id="popular" class="popular-bars-section">
    <div class="section-number-bg num-2">2</div>
    <h2>熱門酒吧推薦，不醉不歸排行榜</h2>
    <div class="bar-cards-container">
      <div class="bar-card" v-for="(bar, index) in bars" :key="index">
        <img :src="bar.image" :alt="bar.name" />
        <div class="bar-info">
          <h3>{{ bar.name }}</h3>
          <p>{{ bar.desc }}</p>
        </div>
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

.features-section, .popular-bars-section {
  padding: 6rem 5%;
  position: relative;
  overflow: hidden;
}

.section-number-bg {
  position: absolute;
  font-size: 30rem;
  font-weight: 900;
  z-index: 0;
  user-select: none;
  transform: translateY(-50%);
  left: 20%;
}

.num-1 {
  color: rgba(255, 255, 255, 0.5);
}
.num-2 {
  color: rgba(218, 162, 88, 0.5);
}


.features-section {
  background-color: rgba(175, 177, 140, 0.5);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
  aspect-ratio: 2.5 / 1;
  position: relative;
  z-index: 2;
}

.feature-card {
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  justify-content: end;
  align-items: center;
  text-align: center;
  font-size: 1.1rem;
  font-weight: 700;
  box-shadow: 0 4px 8px rgba(0,0,0,0.05);
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
}

.feature-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.1);
}

.feature-card h3 {
  margin: 0 0 0.5rem 0;
  font-size: 20px;

}

.feature-card p {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 400;
  color: #666666;
}

.feature-card:nth-child(1) { grid-area: 1 / 2 / 3 / 4; }
.feature-card:nth-child(2) { grid-area: 1 / 1 / 2 / 2; }
.feature-card:nth-child(3) { grid-area: 1 / 4 / 2 / 5; }
.feature-card:nth-child(4) { grid-area: 2 / 1 / 3 / 2; }
.feature-card:nth-child(5) { grid-area: 2 / 4 / 3 / 5; }


.feature-card img {
  filter: grayscale(100%);
  transition: filter 0.3s ease;
  opacity: 0.8;
}
.feature-card img:hover {
  filter: none;
}

.popular-bars-section {
  background-color: #ffffff;
}

.features-section h2, .popular-bars-section h2 {
  text-align: center;
  font-size: 2rem;
  margin-bottom: 1rem;
  font-weight: 700;
}

.bar-cards-container {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  flex-wrap: wrap;
  max-width: 1300px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
}

.bar-card {
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  overflow: hidden;
  width: 280px;
  flex-shrink: 0;
  transition: transform 0.3s, box-shadow 0.3s;
}

.bar-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.15);
}

.bar-card img {
  width: 100%;
  height: 350px;
  object-fit: cover;
  display: block;
}

.bar-card .bar-info {
  padding: 1rem;
}

.bar-card h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
}

.bar-card p {
  margin: 0;
  color: #666666;
  font-size: 0.9rem;
}

</style>