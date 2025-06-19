<script setup>
import { ref, watch, onMounted } from 'vue'

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

function initializeSelectedTags() {
  if (props.modelValue && Array.isArray(props.modelValue) && props.modelValue.length > 0) {
    if (typeof props.modelValue[0] === 'object' && props.modelValue[0].id !== undefined) {
      selectedTags.value = props.modelValue.filter(tag => 
        options.value.some(option => option.id === tag.id)
      )
    } else {
      selectedTags.value = options.value.filter(option => 
        props.modelValue.includes(option.id)
      )
    }
  } else {
    selectedTags.value = []
  }
}

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

watch(() => props.modelValue, (newVal) => {
  if (newVal && Array.isArray(newVal) && newVal.length > 0) {
    if (typeof newVal[0] === 'object' && newVal[0].id !== undefined) {
      selectedTags.value = newVal.filter(tag => 
        options.value.some(option => option.id === tag.id)
      )
    } else {
      selectedTags.value = options.value.filter(option => newVal.includes(option.id))
    }
  } else {
    selectedTags.value = []
  }
}, { immediate: true, deep: true })

onMounted(() => {
  initializeSelectedTags()
})
</script>

<template>
  <div class="form-row">
    <label for="hashtag-input">特色標籤</label>
    <div style="display:flex;align-items:center;gap:8px;width:100%;flex-wrap:wrap;">
      <button type="button" class="btn-hashtag-modal" @click="openModal">選擇</button>
      <div class="selected-tags">
        <div v-if="selectedTags.length === 0" class="no-tags-info" style="color: #666; font-size: 12px;">
          目前無選擇標籤
        </div>
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
@reference "tailwindcss";

.form-row {
  @apply grid grid-cols-[100px_1fr] items-center my-2;
}

.form-row label {
  @apply text-xl text-center;
}

.selected-tags {
  @apply flex flex-wrap gap-2 min-h-8;
}

.selected-tag {
  @apply relative flex items-center mb-1 py-1 text-sm rounded-2xl pr-[11px] pl-2;
  background: #ffecf0;
  color: #c9475d;
}

.remove-tag {
  @apply ml-2 cursor-pointer font-bold select-none text-sm;
  color: #c9475d;
}

.btn-hashtag-modal {
  @apply rounded-2xl py-1 px-4 border-[3px] border-gray-400 text-sm cursor-pointer bg-gray-100;
}

.btn-hashtag-modal:hover {
  @apply bg-red-100;
}

.hashtag-modal-overlay {
  @apply fixed left-0 top-0 w-screen h-screen flex items-center justify-center z-[3000];
  background: rgba(0,0,0,0.20);
}

.hashtag-modal-content {
  @apply bg-white rounded-2xl min-w-[300px] relative shadow-2xl p-[32px_28px_20px_28px];
  animation: popupFadeIn 0.25s;
}

@keyframes popupFadeIn {
  from { transform: scale(0.93); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.modal-header {
  @apply text-xl font-bold mb-4 flex justify-between items-center;
}

.modal-close-btn {
  @apply text-2xl bg-transparent border-none cursor-pointer;
}

.modal-tags {
  @apply flex flex-wrap gap-3 justify-center mb-4;
}

.tag-btn {
  @apply text-base border-2 border-gray-400 rounded-2xl py-2 px-4 cursor-pointer transition-all duration-200 bg-gray-50;
}

.tag-btn.active,
.tag-btn:active {
  @apply bg-red-100 border-red-300;
}

.modal-actions {
  @apply mt-2 text-right;
}

.confirm-btn {
  @apply border-none text-white rounded-2xl text-base py-1 px-6 cursor-pointer ml-3;
  background: var(--color-primary-red, #c9475d);
}

.warning {
  @apply text-sm mr-2;
  color: #c9475d;
}

.no-tags-info {
  @apply text-xs text-gray-500;
}
</style>