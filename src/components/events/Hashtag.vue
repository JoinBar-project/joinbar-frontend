<script setup>
import { ref, watch, defineEmits } from 'vue'
const emit = defineEmits(['update:modelValue'])

// 定義props：從上層給我一包資料，如果沒給，我自己用一份新的
const props = defineProps({
  // modelValue 是陣列，讓預設給空陣列
  modelValue: { type: Array, default: () => [] }
})
const selectedTags = ref([...props.modelValue])

const modalOpen = ref(false)
const options = ref(['免費活動', '限時報名', '單身限定', '週末來喝', '主題之夜', '現場LIVE']) 
const warning = ref('')

function openModal() {
  modalOpen.value = true
  warning.value = ''
}
function closeModal() {
  modalOpen.value = false
  warning.value = ''
}
function toggleTag(tag) {
  // 檢查這個 tag 有沒有在已選標籤列表裡
  const idx = selectedTags.value.indexOf(tag)
  // -1 : 還沒被選過
  if (idx === -1) {
    if (selectedTags.value.length >= 2) {
      warning.value = '最多選擇 2 個標籤'
      return
    }
    selectedTags.value.push(tag)
  } else {
    // 已經選了這個標籤，再選一次 = 移除(splice)
    selectedTags.value.splice(idx, 1)
    warning.value = ''
  }
}
function confirmTags() {
  emit('update:modelValue', [...selectedTags.value])
  closeModal()
}
function removeTag(tag) {
  toggleTag(tag)
}

// 同步
watch(() => props.modelValue, (val) => {
  selectedTags.value = [...val]
})
</script>

<template>
  <div class="form-row">
    <label for="hashtag-input">特色標籤</label>
    <div style="display:flex;align-items:center;gap:8px;width:100%;flex-wrap:wrap;">
      <button type="button" class="btn-hashtag-modal" @click="openModal">選擇</button>
      <div class="selected-tags">
        <span v-for="tag in selectedTags" :key="tag" class="selected-tag">
          {{ tag }}
          <span class="remove-tag" @click="removeTag(tag)">×</span>
        </span>
      </div>
      
    </div>

    <!-- Modal -->
    <div v-if="modalOpen" class="hashtag-modal-overlay" @click.self="closeModal">
      <div class="hashtag-modal-content">
        <div class="modal-header">選擇最多二個特色標籤
          <button type="button" class="modal-close-btn" @click="closeModal">&times;</button>
        </div>
        <div class="modal-tags">
          <button
            v-for="tag in options"
            :key="tag"
            class="tag-btn"
            :class="{active:selectedTags.includes(tag)}"
            @click="toggleTag(tag)"
          >{{ tag }}</button>
        </div>
        <div class="modal-actions">
          <span class="warning" v-if="warning">{{ warning }}</span>
          <button class="confirm-btn" @click="confirmTags">確認</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.form-row {
  display: grid;
  grid-template-columns: 100px 1fr;
  align-items: center;
  margin: 10px 0;
}
.form-row label {
  font-size: 20px;
  text-align: center;
}
.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-height: 30px;
}
.selected-tag {
  background: #ffecf0;
  color: #c9475d;
  padding: 4px 11px 4px 8px;
  border-radius: 15px;
  font-size: 15px;
  margin-bottom: 2px;
  position: relative;
  display: flex;
  align-items: center;
}
.remove-tag {
  font-size: 15px;
  margin-left: 6px;
  cursor: pointer;
  color: #c9475d;
  font-weight: bold;
  user-select: none;
}
.btn-hashtag-modal {
  border-radius: 15px;
  padding: 5px 18px;
  background: #eee;
  border: 3px solid #b9b9b9;
  font-size: 15px;
  cursor: pointer;
}
.btn-hashtag-modal:hover {
  background: #ffe3e3;
}
.hashtag-modal-overlay {
  position: fixed;
  left: 0; top: 0;
  width: 100vw; height: 100vh;
  background: rgba(0,0,0,0.20);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
}
.hashtag-modal-content {
  background: #fff;
  border-radius: 18px;
  min-width: 300px;
  padding: 32px 28px 20px 28px;
  box-shadow: 0 4px 28px #0002;
  position: relative;
  animation: popupFadeIn 0.25s;
}
@keyframes popupFadeIn {
  from { transform: scale(0.93); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
.modal-header {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.modal-close-btn {
  font-size: 22px;
  background: none;
  border: none;
  cursor: pointer;
}
.modal-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin-bottom: 15px;
}
.tag-btn {
  font-size: 16px;
  border: 2px solid #b9b9b9;
  border-radius: 20px;
  padding: 7px 18px;
  background: #faf9f9;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}
.tag-btn.active,
.tag-btn:active {
  background: #ffe3e3;
  border-color: #ffadad;
}
.modal-actions {
  margin-top: 8px;
  text-align: right;
}
.confirm-btn {
  border: none;
  background: var(--color-primary-red, #c9475d);
  color: #fff;
  border-radius: 20px;
  font-size: 16px;
  padding: 6px 22px;
  cursor: pointer;
  margin-left: 12px;
}
.warning {
  color: #c9475d;
  font-size: 15px;
  margin-right: 10px;
}
</style>
