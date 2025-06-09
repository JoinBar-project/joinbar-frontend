<script setup>
import NavBar from "@/components/NavBar.vue";
</script>

<template>
  <div id="app">
    <NavBar />
    <router-view />
  </div>
</template>

<style>
/* 全局樣式 */
body {
  margin: 0;
  font-family: "Noto Sans TC", sans-serif; /* 建議使用更適合中文的字體 */
  overflow-x: hidden; /* 防止水平滾動條 */
  background-color: #f5f5f5; /* 輕微的背景色，讓內容更突出 */
  color: #333; /* 預設文字顏色 */
}

#app {
  /* 應用程式主容器的樣式，例如設定彈性佈局或最小高度 */
  min-height: 100vh; /* 確保應用程式佔滿整個視窗高度 */
  display: flex;
  flex-direction: column;
}

/* 確保路由視圖內容能佔據剩餘空間 */
.router-view-container {
  flex-grow: 1;
  /* 根據需要添加一些通用內邊距或樣式 */
}

/* 這裡可以放置通用的工具類樣式，例如文本顏色、陰影等 */
.text-gray-800 {
  color: #2d3748; /* 深灰色文本 */
}

.text-blue-600 {
  color: #3182ce; /* 藍色文本 */
}

/* 一些通用的卡片或容器樣式 */
.card {
  background-color: #fff;
  border-radius: 0.5rem;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  padding: 1.5rem;
  margin-bottom: 1rem;
}

/* 如果你的 NavBar 有固定位置，可能需要調整 body 的 padding-top */
/* 例如：如果 NavBar 高度是 64px */
/* body {
  padding-top: 64px;
} */
</style>
