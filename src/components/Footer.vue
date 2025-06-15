<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const isFooterVisible = ref(false)

const handleScroll = () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight

  const threshold = 100
  const isNearBottom = scrollTop + windowHeight >= documentHeight - threshold

  if (isNearBottom && !isFooterVisible.value) {
    isFooterVisible.value = true
  } else if (!isNearBottom && isFooterVisible.value) {
    isFooterVisible.value = false
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
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
@reference "tailwindcss";

.footer {
  @apply fixed bottom-0 left-0 w-full bg-black text-[#e0e0e0] px-[5%] py-8 box-border z-[1000] translate-y-full opacity-0 transition-all duration-[400ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] shadow-[0_-1_5_rgba(0,0,0,0.3)];
}

.footer-visible {
  @apply translate-y-0 opacity-100;
}

.footer-content {
  @apply flex items-center justify-between gap-8 mx-auto;
}

.footer-logo img {
  width: 250px;
  height: auto;
}

.footer-links {
  @apply flex gap-8;
}

.footer-links a {
  @apply text-[#e0e0e0] no-underline transition-colors duration-300 ease-in-out font-medium;
}

.footer-links a:hover {
  @apply text-white;
}

.footer-socials {
  @apply flex gap-4;
}

.footer-socials a {
  @apply text-xl transition-all duration-300 ease-in-out p-2;
}

.footer-socials a:hover {
  @apply text-white bg-white/20 -translate-y-0.5;
}

.footer-bottom {
  @apply text-center text-sm opacity-80 mx-auto max-w-[300px] border-t border-white/10 pt-4;
}

</style>