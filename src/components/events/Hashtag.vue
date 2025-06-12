<script setup>
import { ref, watch } from 'vue'
const emit = defineEmits(['update:modelValue'])

const props = defineProps({
  modelValue: { type: Array, default: () => [] }
})

const options = ref([
  { id: 1, name: '免費活動' },
  { id: 2, name: '限時報名' },
  { id: 3, name: '單身限定' },
  { id: 4, name: '週末來喝' },
  { id: 5, name: '主題之夜' },
  { id: 6, name: '現場LIVE' },
])

const selectedTags = ref([])
const modalOpen = ref(false)
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
  const idx = selectedTags.value.findIndex(t => t.id === tag.id)
  if (idx === -1) {
    if (selectedTags.value.length >= 2) {
      warning.value = '最多選擇 2 個標籤'
      return
    }
    selectedTags.value.push(tag)
  } else {
    selectedTags.value.splice(idx, 1)
    warning.value = ''
  }
  emit('update:modelValue', selectedTags.value.map(tag => tag.id))
}
function confirmTags() {
  emit('update:modelValue', selectedTags.value.map(tag => tag.id))
  closeModal()
}
function removeTag(tag) {
  toggleTag(tag)
}

// 同步：modelValue（id陣列）→ selectedTags（物件陣列）
watch(() => props.modelValue, (val) => {
  selectedTags.value = options.value.filter(option => val.includes(option.id))
})
</script>

<template>
  <div class="form-row">
    <label for="hashtag-input">特色標籤</label>
    <div style="display:flex;align-items:center;gap:8px;width:100%;flex-wrap:wrap;">
      <button type="button" class="btn-hashtag-modal" @click="openModal">選擇</button>
      <div class="selected-tags">
        <span v-for="tag in selectedTags" :key="tag.id" class="selected-tag">
          {{ tag.name }}
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
            :key="tag.id"
            class="tag-btn"
            :class="{active: selectedTags.some(t => t.id === tag.id)}"
            @click="toggleTag(tag)"
          >{{ tag.name }}</button>
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
