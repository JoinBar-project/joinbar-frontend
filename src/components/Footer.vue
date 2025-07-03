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
        <a href="https://joinbar-backend.zeabur.app/api-docs/">API 文件</a>
      </div>

      <!-- 酒駕提醒 -->
      <div class="footer-right">
        <div class="responsibility-section">
          <span class="responsibility-main">理性飲酒・安全回家</span>
          <span class="responsibility-sub">Drink Responsibly</span>
        </div>
        <div class="copyright">
          &copy; 2025 JoinBar. All rights reserved.
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
@reference "tailwindcss";
.footer {
  @apply w-full bg-black text-[#e0e0e0] px-[5%] py-4 box-border z-[1000]
    shadow-[0_-1px_5px_rgba(0,0,0,0.3)];
}

.footer-content {
  @apply flex flex-col items-center justify-center gap-4 mx-auto text-center;
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

.responsibility-link {
  @apply font-medium text-sm relative transition-all duration-300 ease-in-out cursor-default;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  position: relative;
}

.responsibility-link::before {
  content: '';
  @apply absolute -left-3 top-1/2 w-1.5 h-1.5 rounded-full;
  background: radial-gradient(circle, #f59e0b, #d97706);
  transform: translateY(-50%);
  animation: gentleGlow 2s ease-in-out infinite;
  box-shadow: 0 0 4px rgba(245, 158, 11, 0.5);
}

.responsibility-link:hover {
  filter: brightness(1.2);
  text-shadow: 0 0 8px rgba(251, 191, 36, 0.4);
}

@keyframes gentleGlow {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

@keyframes subtleShimmer {
  0%, 100% {
    filter: brightness(1);
    text-shadow: 0 0 10px rgba(251, 191, 36, 0.3);
  }
  50% {
    filter: brightness(1.1);
    text-shadow: 0 0 15px rgba(251, 191, 36, 0.4);
  }
}

.footer-right {
  @apply flex flex-col items-center gap-2 md:items-end;
}

.responsibility-section {
  @apply flex flex-col items-center gap-1 md:items-end relative;
}

.responsibility-main {
  @apply text-orange-300 font-medium text-base relative;
  background: linear-gradient(120deg, #f6d365 0%, #fda085 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 8px rgba(251, 191, 36, 0.3);
  animation: subtleShimmer 3s ease-in-out infinite;
}

.responsibility-sub {
  @apply text-sm font-light italic tracking-wide relative;
  background: linear-gradient(120deg, #f6d365 0%, #fda085 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  opacity: 0.8;
}

.copyright {
  @apply text-sm opacity-80;
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

/* 手機版優化 */
@media (max-width: 768px) {
  .footer-content {
    @apply gap-3;
  }
  
  .footer-logo img {
    width: 120px;
  }
  
  .footer-links {
    @apply gap-4 text-center;
  }
  
  .footer-links a {
    @apply text-sm; 
  }
  
  .responsibility-link {
    @apply text-xs mt-2 w-full;
  }
  
  .responsibility-link::before {
    @apply hidden;
  }
  
  .footer-right {
    @apply items-center;
  }
  
  .responsibility-section {
    @apply items-center;
  }

  .footer-socials {
    @apply gap-2;
  }
  
  .footer-socials a {
    @apply text-base p-1;
  }
}
</style>