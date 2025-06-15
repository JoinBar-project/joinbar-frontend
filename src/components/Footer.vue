<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const isFooterVisible = ref(false)

const handleScroll = () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight
  
  const threshold = 100
  const isNearBottom = scrollTop + windowHeight >= documentHeight - threshold
  
  isFooterVisible.value = isNearBottom
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  handleScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

</script>

<template>
  <footer 
    class="footer" 
    :class="{ 'footer-visible': isFooterVisible }"
  >
    <div class="footer-content">
      <div class="footer-logo">
        <a href="#">
          <img src="../../../public/joinbar-logo.png" alt="JoinBar Logo">
        </a>
      </div>
      <div class="footer-links">
        <a href="#">酒吧地圖</a>
        <a href="#">酒吧評論</a>
        <a href="#">酒吧活動</a>
        <a href="#">訂閱優惠</a>
        <a href="#">聯絡我們</a>
      </div>
      <div class="footer-socials">
        <a href="#"><i class="fab fa-facebook-f"></i></a>
        <a href="#"><i class="fab fa-twitter"></i></a>
        <a href="#"><i class="fab fa-instagram"></i></a>
      </div>
    </div>
    <div class="footer-bottom">
      &copy; 2025 JoinBar. All rights reserved.
    </div>
  </footer>
</template>

<style scoped>
.footer {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background-color: var(--color-black);
  color: #e0e0e0;
  padding: 2rem 5%;
  box-sizing: border-box;
  z-index: 1000;
  transform: translateY(100%);
  opacity: 0;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
}

.footer-visible {
  transform: translateY(0);
  opacity: 1;
}

.footer-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  margin: 0 auto;
}

.footer-logo img {
  width: 250px;
  height: auto;
}

.footer-links {
  display: flex;
  gap: 2rem;
}

.footer-links a {
  color: #e0e0e0;
  text-decoration: none;
  transition: color 0.3s ease;
  font-weight: 500;
}

.footer-links a:hover {
  color: #ffffff;
}

.footer-socials {
  display: flex;
  gap: 1rem;
}

.footer-socials a {
  font-size: 1.2rem;
  transition: all 0.3s ease;
  padding: 0.5rem;
}

.footer-socials a:hover {
  color: #ffffff;
  background-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.footer-bottom {
  text-align: center;
  font-size: 0.9rem;
  opacity: 0.8;
  margin: 0 auto;
  max-width: 1200px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 1rem;
}

</style>