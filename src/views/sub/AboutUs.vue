<template>
  <div class="min-h-screen bg-gradient-to-br from-[#2a2426] via-[#1f1b1c] to-[#2a2426] relative overflow-hidden py-8">
    <!-- 簡潔背景裝飾 -->
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#3A3435]/30 via-transparent to-transparent"></div>
    
    <div class="text-center mb-12 py-12 px-4 relative z-10">
      <div class="relative inline-block">
        <h1 class="text-8xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary-orange)] to-[var(--color-secondary-green)] mb-2 tracking-wide drop-shadow-2xl">
          關於我們
        </h1>
        <div class="absolute -inset-2 bg-gradient-to-r from-[#afb18c]/20 to-[#e1ac67]/20 rounded-xl blur-xl opacity-40 animate-pulse"></div>
      </div>
      <div class="mt-4">
        <p class="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-secondary-green)] to-[var(--color-primary-orange)]">
        認識我們的開發團隊
        </p>
      </div>

      <div class="flex justify-center mt-8">
        <div class="w-40 h-1 bg-gradient-to-r from-transparent via-[#afb18c] through-[#e1ac67] to-transparent rounded-full shadow-lg"></div>
      </div>
    </div>

    <!-- 團隊成員區域 -->
    <div class="max-w-[1400px] mx-auto px-4 relative z-10">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <!-- 成員1 -->
        <div class="member-card group relative overflow-hidden bg-white/90 backdrop-blur-sm rounded-[20px] p-8 text-center shadow-[0_25px_60px_rgba(0,0,0,0.25)] transition-all duration-500 hover:-translate-y-4 border">
          <div class="mb-6">
            <img src="/xinyu.jpg" alt="成員1" class="w-[120px] h-[120px] rounded-full object-cover border-[4px] shadow-[0_5px_15px_rgba(0,0,0,0.1)] transition-transform duration-500 group-hover:scale-110 mx-auto ring-4" />
          </div>
          <div class="text-center">
            <h3 class="text-[1.5rem] font-semibold text-[#2c3e50] mb-2">卓訢妤</h3>
            <p class="text-base text-[#7f8c8d] font-medium mb-4">負責內容</p>
            <p class="text-sm text-[#5a6c7d] leading-relaxed mb-6">
              串接 Google Map API <br>
              酒吧偏好、標籤資料庫建置 <br>
              酒吧標籤後端 API 設計及 CRUD <br>
              導入 Gemini AI 實現智慧酒吧 推薦系統 <br>
              登入、註冊、酒吧收藏切版
            </p>
            <div class="flex justify-center gap-4">
              <a href="https://github.com/2xin15" target="_blank" class="inline-flex items-center gap-2 px-8 py-2 text-sm font-medium rounded-full transition-all duration-300 bg-[#24292e] text-white hover:bg-[#1a1e22] hover:-translate-y-0.5">
                <i class="fab fa-github"></i>
                GitHub
              </a>
              <a href="mailto:s111291519xin@gapp.nthu.edu.tw" class="inline-flex items-center gap-2 px-8 py-2 text-sm font-medium rounded-full transition-all duration-300 bg-[var(--color-primary-orange)] text-white hover:bg-[var(--color-secondary-green)] hover:-translate-y-0.5">
                <i class="fas fa-envelope"></i>
                Email
              </a>
            </div>
          </div>
        </div>

        <!-- 成員2 -->
        <div class="member-card group relative overflow-hidden bg-white/90 backdrop-blur-sm rounded-[20px] p-8 text-center shadow-[0_25px_60px_rgba(0,0,0,0.25)] transition-all duration-500 hover:-translate-y-4 border">
          <div class="mb-6">
            <img src="/ting.png" alt="成員2" class="w-[120px] h-[120px] rounded-full object-cover border-[4px] shadow-[0_5px_15px_rgba(0,0,0,0.1)] transition-transform duration-500 group-hover:scale-110 mx-auto ring-4" />
          </div>
          <div class="text-center">
            <h3 class="text-[1.5rem] font-semibold text-[#2c3e50] mb-2">陳紫婷</h3>
            <p class="text-base text-[#7f8c8d] font-medium mb-4">負責內容</p>
            <p class="text-sm text-[#5a6c7d] leading-relaxed mb-6">
              會員資料表建置 <br>
              註冊登入及會員資料後端 API<br>
              會員個人資料及頭像串接<br>
              活動紀錄切版
            </p>
            <div class="flex justify-center gap-4">
              <a href="https://github.com/jasminecchen" target="_blank" class="inline-flex items-center gap-2 px-8 py-2 text-sm font-medium rounded-full transition-all duration-300 bg-[#24292e] text-white hover:bg-[#1a1e22] hover:-translate-y-0.5">
                <i class="fab fa-github"></i>
                GitHub
              </a>
              <a href="mailto:tingone59@gmail.com" class="inline-flex items-center gap-2 px-8 py-2 text-sm font-medium rounded-full transition-all duration-300 bg-[var(--color-primary-orange)] text-white hover:bg-[var(--color-secondary-green)] hover:-translate-y-0.5">
                <i class="fas fa-envelope"></i>
                Email
              </a>
            </div>
          </div>
        </div>

        <!-- 成員3 -->
        <div class="member-card group relative overflow-hidden bg-white/90 backdrop-blur-sm rounded-[20px] p-8 text-center shadow-[0_25px_60px_rgba(0,0,0,0.25)] transition-all duration-500 hover:-translate-y-4 border">
          <div class="mb-6">
            <img src="/bella.jpg" alt="成員3" class="w-[120px] h-[120px] rounded-full object-cover border-[4px] shadow-[0_5px_15px_rgba(0,0,0,0.1)] transition-transform duration-500 group-hover:scale-110 mx-auto ring-4" />
          </div>
          <div class="text-center">
            <h3 class="text-[1.5rem] font-semibold text-[#2c3e50] mb-2">鄭婉君</h3>
            <p class="text-base text-[#7f8c8d] font-medium mb-4">負責內容</p>
            <p class="text-sm text-[#5a6c7d] leading-relaxed mb-6">
              後端環境建構 <br>
              活動資料庫建置<br>
              活動後端 API 設計及 CRUD<br>
              活動前端切版畫面<br>
              訂閱切版 及 串接金流<br>
              訂閱後端 API 設計及 CRUD
            </p>
            <div class="flex justify-center gap-4">
              <a href="https://github.com/Bella-Cheng" target="_blank" class="inline-flex items-center gap-2 px-8 py-2 text-sm font-medium rounded-full transition-all duration-300 bg-[#24292e] text-white hover:bg-[#1a1e22] hover:-translate-y-0.5">
                <i class="fab fa-github"></i>
                GitHub
              </a>
              <a href="mailto:dhp951320@gmail.com" class="inline-flex items-center gap-2 px-8 py-2 text-sm font-medium rounded-full transition-all duration-300 bg-[var(--color-primary-orange)] text-white hover:bg-[var(--color-secondary-green)] hover:-translate-y-0.5">
                <i class="fas fa-envelope"></i>
                Email
              </a>
            </div>
          </div>
        </div>

        <!-- 成員4 -->
        <div class="member-card group relative overflow-hidden bg-white/90 backdrop-blur-sm rounded-[20px] p-8 text-center shadow-[0_25px_60px_rgba(0,0,0,0.25)] transition-all duration-500 hover:-translate-y-4 border">
          <div class="mb-6">
            <img src="/yaxin.png" alt="成員4" class="w-[120px] h-[120px] rounded-full object-cover border-[4px] shadow-[0_5px_15px_rgba(0,0,0,0.1)] transition-transform duration-500 group-hover:scale-110 mx-auto ring-4" />
          </div>
          <div class="text-center">
            <h3 class="text-[1.5rem] font-semibold text-[#2c3e50] mb-2">紀雅馨</h3>
            <p class="text-base text-[#7f8c8d] font-medium mb-4">負責內容</p>
            <p class="text-sm text-[#5a6c7d] leading-relaxed mb-6">
              前端基礎建構 <br>
              活動功能模組化設計<br>
              建立活動首頁資料取得 API<br>
              活動頁切版畫面
            </p>
            <div class="flex justify-center gap-4">
              <a href="https://github.com/rakku2code" target="_blank" class="inline-flex items-center gap-2 px-8 py-2 text-sm font-medium rounded-full transition-all duration-300 bg-[#24292e] text-white hover:bg-[#1a1e22] hover:-translate-y-0.5">
                <i class="fab fa-github"></i>
                GitHub
              </a>
              <a href="mailto:rakku2code@gmail.com" class="inline-flex items-center gap-2 px-8 py-2 text-sm font-medium rounded-full transition-all duration-300 bg-[var(--color-primary-orange)] text-white hover:bg-[var(--color-secondary-green)] hover:-translate-y-0.5">
                <i class="fas fa-envelope"></i>
                Email
              </a>
            </div>
          </div>
        </div>

        <!-- 成員5 -->
        <div class="member-card group relative overflow-hidden bg-white/90 backdrop-blur-sm rounded-[20px] p-8 text-center shadow-[0_25px_60px_rgba(0,0,0,0.25)] transition-all duration-500 hover:-translate-y-4 border">
          <div class="mb-6">
            <img src="/tsai.jpg" alt="成員5" class="w-[120px] h-[120px] rounded-full object-cover border-[4px] shadow-[0_5px_15px_rgba(0,0,0,0.1)] transition-transform duration-500 group-hover:scale-110 mx-auto ring-4" />
          </div>
          <div class="text-center">
            <h3 class="text-[1.5rem] font-semibold text-[#2c3e50] mb-2">蔡昌成</h3>
            <p class="text-base text-[#7f8c8d] font-medium mb-4">負責內容</p>
            <p class="text-sm text-[#5a6c7d] leading-relaxed mb-6">
              註冊登入前端邏輯串接 Pinia store 設計 <br>
              第三方登入後端api設計<br>
              驗證信功能實作與重發冷卻機制<br>
              軟刪除機制<br>
              API 整合 - Axios 攔截器、錯誤處理、認證機制
            </p>
            <div class="flex justify-center gap-4">
              <a href="https://github.com/kirito489" target="_blank" class="inline-flex items-center gap-2 px-8 py-2 text-sm font-medium rounded-full transition-all duration-300 bg-[#24292e] text-white hover:bg-[#1a1e22] hover:-translate-y-0.5">
                <i class="fab fa-github"></i>
                GitHub
              </a>
              <a href="mailto:aobc55625@gmail.com" class="inline-flex items-center gap-2 px-8 py-2 text-sm font-medium rounded-full transition-all duration-300 bg-[var(--color-primary-orange)] text-white hover:bg-[var(--color-secondary-green)] hover:-translate-y-0.5">
                <i class="fas fa-envelope"></i>
                Email
              </a>
            </div>
          </div>
        </div>

        <!-- 成員6 -->
        <div class="member-card group relative overflow-hidden bg-white/90 backdrop-blur-sm rounded-[20px] p-8 text-center shadow-[0_25px_60px_rgba(0,0,0,0.25)] transition-all duration-500 hover:-translate-y-4 border">
          <div class="mb-6">
            <img src="/bing.jpg" alt="成員6" class="w-[120px] h-[120px] rounded-full object-cover border-[4px] shadow-[0_5px_15px_rgba(0,0,0,0.1)] transition-transform duration-500 group-hover:scale-110 mx-auto ring-4" />
          </div>
          <div class="text-center">
            <h3 class="text-[1.5rem] font-semibold text-[#2c3e50] mb-2">戎彬</h3>
            <p class="text-base text-[#7f8c8d] font-medium mb-4">負責內容</p>
            <p class="text-sm text-[#5a6c7d] leading-relaxed mb-6">
              購物車、結帳頁面切版 <br>
              訂單前後端 API 串接<br>
              Line Pay 串接<br>
              購物車後端 API 設計<br>
              訂單管理頁面切版
            </p>
            <div class="flex justify-center gap-4">
              <a href="https://github.com/Benjung1215" target="_blank" class="inline-flex items-center gap-2 px-8 py-2 text-sm font-medium rounded-full transition-all duration-300 bg-[#24292e] text-white hover:bg-[#1a1e22] hover:-translate-y-0.5">
                <i class="fab fa-github"></i>
                GitHub
              </a>
              <a href="mailto:ab4827qq@gmail.com" class="inline-flex items-center gap-2 px-8 py-2 text-sm font-medium rounded-full transition-all duration-300 bg-[var(--color-primary-orange)] text-white hover:bg-[var(--color-secondary-green)] hover:-translate-y-0.5">
                <i class="fas fa-envelope"></i>
                Email
              </a>
            </div>
          </div>
        </div>

        <!-- 成員7 -->
        <div class="member-card group relative overflow-hidden bg-white/95 backdrop-blur-sm rounded-[20px] p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.15)] transition-all duration-500 hover:-translate-y-3 hover:shadow-[0_30px_80px_rgba(139,69,19,0.25)] border border-white/20">
          <div class="mb-6">
            <img src="/wuu.png" alt="成員7" class="w-[120px] h-[120px] rounded-full object-cover border-[4px] border-[#f8f9fa] shadow-[0_5px_15px_rgba(0,0,0,0.1)] transition-transform duration-300 hover:scale-105 hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)] mx-auto" />
          </div>
          <div class="text-center">
            <h3 class="text-[1.5rem] font-semibold text-[#2c3e50] mb-2">竇孝武</h3>
            <p class="text-base text-[#7f8c8d] font-medium mb-4">負責內容</p>
            <p class="text-sm text-[#5a6c7d] leading-relaxed mb-6">
              地圖關鍵字搜尋、即時地點建議 <br>
              即時篩選更新、多重篩選設定<br>
              動態酒吧資訊、酒吧詳情頁面<br>
              串接酒吧資料庫與收藏頁面 API
            </p>
            <div class="flex justify-center gap-4">
              <a href="https://github.com/DouFreddy" target="_blank" class="inline-flex items-center gap-2 px-8 py-2 text-sm font-medium rounded-full transition-all duration-300 bg-[#24292e] text-white hover:bg-[#1a1e22] hover:-translate-y-0.5">
                <i class="fab fa-github"></i>
                GitHub
              </a>
              <a href="mailto:funbeanbean@gmail.com" class="inline-flex items-center gap-2 px-8 py-2 text-sm font-medium rounded-full transition-all duration-300 bg-[var(--color-primary-orange)] text-white hover:bg-[var(--color-secondary-green)] hover:-translate-y-0.5">
                <i class="fas fa-envelope"></i>
                Email
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
export default {
  name: 'AboutUs',
  mounted() {
    document.title = '關於我們 - 酒吧資訊平台'
  }
}
</script>

<style scoped>
.member-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: linear-gradient(90deg, #afb18c, #e1ac67);
  border-radius: 20px 20px 0 0;
}

.member-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(45deg, transparent, rgba(175, 177, 140, 0.06), rgba(225, 172, 103, 0.06), transparent);
  opacity: 0;
  transition: opacity 0.5s ease;
  border-radius: 20px;
  pointer-events: none;
}

.member-card:hover::after {
  opacity: 1;
}

/* 奇數卡片：綠色系 (1, 3, 5, 7) */
.member-card:nth-child(odd) {
  border-color: rgba(175, 177, 140, 0.3) !important;
}

.member-card:nth-child(odd):hover {
  box-shadow: 0 35px 80px rgba(175, 177, 140, 0.3) !important;
}

.member-card:nth-child(odd) img {
  border-color: rgba(175, 177, 140, 0.6) !important;
  box-shadow: 0 8px 25px rgba(175, 177, 140, 0.2) !important;
  ring-color: rgba(175, 177, 140, 0.5) !important;
}

.member-card:nth-child(odd):hover img {
  box-shadow: 0 15px 35px rgba(175, 177, 140, 0.4) !important;
}

/* 偶數卡片：橘色系 (2, 4, 6) */
.member-card:nth-child(even) {
  border-color: rgba(225, 172, 103, 0.3) !important;
}

.member-card:nth-child(even):hover {
  box-shadow: 0 35px 80px rgba(225, 172, 103, 0.3) !important;
}

.member-card:nth-child(even) img {
  border-color: rgba(225, 172, 103, 0.6) !important;
  box-shadow: 0 8px 25px rgba(225, 172, 103, 0.2) !important;
  ring-color: rgba(225, 172, 103, 0.5) !important;
}

.member-card:nth-child(even):hover img {
  box-shadow: 0 15px 35px rgba(225, 172, 103, 0.4) !important;
}

.project-title {
  font-size: 2rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 1rem;
}

.project-description {
  font-size: 1.1rem;
  color: #5a6c7d;
  line-height: 1.8;
  margin: 0;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .text-6xl {
    font-size: 3rem;
  }
  
  .md\:text-7xl {
    font-size: 3.5rem;
  }
  
  .text-xl {
    font-size: 1.1rem;
  }
  
  .md\:text-2xl {
    font-size: 1.3rem;
  }
  
  .text-2xl {
    font-size: 1.4rem;
  }
  
  .md\:text-3xl {
    font-size: 1.6rem;
  }
  
  .member-card {
    padding: 1.5rem;
  }
}

@media (max-width: 480px) {
  .py-12 {
    padding-top: 2rem;
    padding-bottom: 2rem;
  }
  
  .mb-16 {
    margin-bottom: 2rem;
  }
}
</style>