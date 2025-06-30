<script setup>
import NavBar from '@/components/NavBar.vue';
import Footer from '@/components/Footer.vue';
import { onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import JoinBot from '@/components/JoinBot.vue';
import BaseAlertModal from '@/components/common/BaseAlertModal.vue';
import { useAlertModal } from '@/composables/useAlertModal';

const { alertModal, closeAlert } = useAlertModal();

const router = useRouter();
const route = useRoute();

// 全局 LINE Pay 回調處理
const handleGlobalLinePayCallback = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const transactionId = urlParams.get('transactionId');
  const orderId = urlParams.get('orderId');

  console.log('🔍 App.vue 檢查 LINE Pay 回調:', {
    href: window.location.href,
    transactionId,
    orderId,
    currentPath: route.path
  });

  // 如果有 LINE Pay 參數且不在正確頁面
  if (transactionId && orderId && route.path !== '/payment-waiting') {
    console.log('✅ 檢測到 LINE Pay 回調，跳轉到等待頁面');

    router.replace({
      path: '/payment-waiting',
      query: { orderId, transactionId }
    });
  }
};

onMounted(() => {
  // 頁面載入時檢查
  handleGlobalLinePayCallback();
});

// 監聽路由變化
router.afterEach(to => {
  // 每次路由變化都檢查
  setTimeout(() => {
    handleGlobalLinePayCallback();
  }, 100);
});
</script>

<template>
  <div class="app-layout">
    <NavBar />
    <main class="main-content">
      <router-view />
    </main>
    <Footer />
    <JoinBot />
  </div>

  <BaseAlertModal
    :visible="alertModal.visible"
    :type="alertModal.type"
    :title="alertModal.title"
    :message="alertModal.message"
    :confirmText="alertModal.confirmText"
    @close="closeAlert" />
</template>


<style>
body {
  margin: 0;
  font-family: Arial, sans-serif;
  overflow-x: hidden; /* 防止水平滾動條 */
}

.home {
  padding: 2rem;
  text-align: center;
}

.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  /*主內容填滿空間，footer 推到底 */
    flex: 1; 
}
</style>
