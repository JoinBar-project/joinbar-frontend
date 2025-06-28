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
  @apply flex items-center justify-between gap-8 mx-auto;
}

.footer-logo img {
  width: 160px;
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

.copyright {
  @apply text-center text-sm opacity-80 mx-auto max-w-[300px] pl-4;
}
</style>