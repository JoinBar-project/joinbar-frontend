<template>
  <footer ref="footerRef" class="footer">
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
      <!-- 酒駕提醒 -->
      <div class="drink-drive-warning">
        <span class="warning-icon">⚠️</span>
        <span class="warning-text">喝酒不開車　開車不喝酒</span>
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
  width: 200px;
  height: auto;
}

.footer-links {
  @apply flex flex-wrap justify-center gap-6;
}

.footer-links a {
  @apply text-[#e0e0e0] no-underline transition-colors duration-300 ease-in-out font-medium;
}

.footer-links a:hover {
  @apply text-white;
}

.drink-drive-warning {
  @apply flex items-center gap-2 px-4 py-2 rounded-lg
    bg-orange-500/10 border border-orange-500/20
    transition-all duration-300 hover:bg-orange-500/15;
}

.warning-icon {
  @apply text-base animate-pulse;
}

.warning-text {
  @apply text-orange-400 font-semibold text-sm whitespace-nowrap;
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
  @apply text-sm opacity-80;
}

/* 手機版優化 */
@media (max-width: 768px) {
  .footer-content {
    @apply gap-4;
  }
  
  .footer-logo img {
    width: 120px;
  }
  
  .footer-links {
    @apply gap-3;
  }
  
  .footer-links a {
    @apply text-sm; 
  }
  
  .drink-drive-warning {
    @apply px-3 py-1;
  }
  
  .warning-text {
    @apply text-xs; 
  }

  .footer-socials {
    @apply gap-2;
  }
  
  .footer-socials a {
    @apply text-base p-1;
  }
  
  .copyright {
    @apply text-xs;
  }
}
</style>