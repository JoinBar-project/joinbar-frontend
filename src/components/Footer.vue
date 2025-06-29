<template>
  <footer 
    ref="footerRef"
    class="footer"
  >
    <div class="footer-content">
      <div class="footer-logo">
        <a href="#">
          <img src="/joinbar-logo.png" alt="JoinBar Logo">
        </a>
      </div>

      <div class="footer-links">
        <router-link to="/map">酒吧地圖</router-link>
        <router-link to="/event">酒吧活動</router-link>
        <router-link to="/subscription">訂閱優惠</router-link>
        <router-link to="/aboutUs">關於我們</router-link>
      </div>

      <div class="copyright">
        &copy; 2025 JoinBar. All rights reserved.
      </div>
    </div>
  </footer>
</template>


<style scoped>
@reference "tailwindcss";

.footer {
  @apply w-full bg-black text-[#e0e0e0] px-[5%] py-8 box-border z-[1000]
        shadow-[0_-1px_5px_rgba(0,0,0,0.3)];
}

.footer-content {
  @apply flex flex-col items-center justify-center gap-6 mx-auto text-center;

  /* 桌面版橫向排列 */
  @apply md:flex-row md:justify-between md:items-center md:text-left md:gap-8;
}

.footer-logo img {
  width: 160px;
  height: auto;
}

.footer-links {
  @apply flex flex-wrap justify-center gap-6 text-base;

  /* 桌面版靠左排列 */
  @apply md:justify-start;
}

.footer-links a {
  @apply text-[#e0e0e0] no-underline transition-colors duration-300 ease-in-out font-medium;
}

.footer-links a:hover {
  @apply text-white;
}

.copyright {
  @apply text-sm opacity-80 max-w-[300px];

  /* 手機置中、桌面靠右 */
  @apply text-center md:text-right;
}
</style>