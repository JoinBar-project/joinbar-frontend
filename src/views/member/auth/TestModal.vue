<template>
  <div class="p-8 space-y-4">
    <h1 class="mb-6 text-2xl font-bold">模態框測試頁面</h1>
    
    <div class="grid grid-cols-2 gap-4 md:grid-cols-3">
      <button @click="showAlert('success', '操作成功', '您的操作已成功完成！')" 
              class="p-4 bg-green-100 border border-green-300 rounded-lg hover:bg-green-200">
        <div class="font-semibold text-green-600">成功提示</div>
        <div class="text-sm text-green-500">點擊測試</div>
      </button>
      
      <button @click="showAlert('error', '操作失敗', '抱歉，操作過程中發生錯誤')" 
              class="p-4 bg-red-100 border border-red-300 rounded-lg hover:bg-red-200">
        <div class="font-semibold text-red-600">錯誤提示</div>
        <div class="text-sm text-red-500">點擊測試</div>
      </button>
      
      <button @click="showAlert('warning', '注意事項', '請仔細檢查您的輸入內容')" 
              class="p-4 bg-yellow-100 border border-yellow-300 rounded-lg hover:bg-yellow-200">
        <div class="font-semibold text-yellow-600">警告提示</div>
        <div class="text-sm text-yellow-500">點擊測試</div>
      </button>
      
      <button @click="showAlert('info', '系統提示', '這是一個重要的系統訊息')" 
              class="p-4 bg-blue-100 border border-blue-300 rounded-lg hover:bg-blue-200">
        <div class="font-semibold text-blue-600">資訊提示</div>
        <div class="text-sm text-blue-500">點擊測試</div>
      </button>
      
      <button @click="showAlert('default', '預設樣式', '這是原本的設計樣式')" 
              class="p-4 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200">
        <div class="font-semibold text-gray-600">預設樣式</div>
        <div class="text-sm text-gray-500">點擊測試</div>
      </button>
    </div>

    <!-- BaseAlertModal -->
    <BaseAlertModal
      :visible="alertModal.visible"
      :type="alertModal.type"
      :title="alertModal.title"
      :message="alertModal.message"
      :confirmText="alertModal.confirmText"
      @close="closeAlert"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import BaseAlertModal from '@/components/common/BaseAlertModal.vue'

const alertModal = ref({
  visible: false,
  type: 'default',
  title: '',
  message: '',
  confirmText: '確認'
})

const showAlert = (type, title, message, confirmText = '確認') => {
  alertModal.value = {
    visible: true,
    type,
    title,
    message,
    confirmText
  }
}

const closeAlert = () => {
  alertModal.value.visible = false
}
</script>