<script setup>
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css';

const props = defineProps({
  image: {
    type: String,
    required: true
  },
  visible: Boolean,
  aspectRatio: {
    type: Number,
    default: 1 / 1,
  }
})

const emit = defineEmits(['confirm', 'cancel'])
let currentResult = null; // 記錄當下的裁切結果用的

// 只要有移動裁切框，套件就會自動產生一個裁切後的畫布
const handleChange = ({ canvas }) => {
  currentResult = canvas // 把畫布會存在 currentResult 裡
}

const confirmCrop = () => {
  if (currentResult) {
    const base64 = currentResult.toDataURL() // 將裁切後的圖片轉成 base64 編碼的圖片字串
    emit('confirm', base64)
  }
}

const cancelCrop = () => {
  emit('cancel')
}
</script>

<template>
  <div v-if="visible">
    <Cropper 
    :src='image' 
    :stencil-props="{ aspectRatio }" 
    @change="handleChange" />

    <button @click="cancelCrop">取消</button>
    <button @click="confirmCrop">確認</button>
  </div>
</template>