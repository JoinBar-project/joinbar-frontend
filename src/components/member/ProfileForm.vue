<script setup>
import { NDatePicker } from 'naive-ui';

const emit = defineEmits(['update:form']);

// 將字串轉成 timestamp (因為 Naive UI 的 n-date-picker 只接受數字或陣列)
const stringToTimestamp = dateString => {
  if (!dateString) return null;

  // 手動解析日期字串，避免因時區關係，儲存後日期少一天的問題
  const [year, month, day] = dateString.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return date.getTime();
};

// 使用者選擇日期時，將 timestamp 轉回 yyyy-MM-dd 格式
const updateBirthday = timestamp => {
  let formattedDate = null;

  if (timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    formattedDate = `${year}-${month}-${day}`;
  }

  emit('update:form', {
    ...props.form,
    birthday: formattedDate
  });
};

const props = defineProps({
  form: Object,
  isEdit: Boolean,
  profileFields: Array,
  errors: {
    type: Object,
    default: () => ({}),
  },
});
</script>

<template>
  <div class="w-full space-y-4">
    <div class="flex flex-col items-center w-full md:items-start">
      <div v-for="(field, index) in profileFields" :key="index" class="mb-4">
        <label :for="field.model" class="block mb-1 text-sm font-semibold text-gray-700">
          {{ field.label }}
        </label>
        <div class="w-64">
          <div class="flex items-center w-64 px-3 py-2 bg-white border rounded"
            :class="[errors[field.model] 
            ? 'border-[var(--color-primary-orange)] border-2' 
            : 'border-gray-400']">
            <i :class="[field.icon, 'text-gray-400 mr-2']" />

            <!-- 編輯模式 -->
            <template v-if="isEdit">
              <!-- 生日欄位 -->
              <template v-if="field.type === 'date'">
                <n-date-picker
                  :value="stringToTimestamp(form[field.model])"
                  @update:value="updateBirthday"
                  type="date"
                  format="yyyy-MM-dd"
                  :placeholder="field.placeholder"
                  clearable
                  class="w-full outline-none text-sm text-[var(--color-primary-black)] placeholder-[text-gray-400] bg-transparent" />
              </template>

              <!-- 其他欄位 -->
              <template v-else>
                <input
                  :id="field.model"
                  :type="field.type"
                  v-model="form[field.model]"
                  :placeholder="field.placeholder"
                  class="w-full outline-none text-sm text-[var(--color-primary-black)] placeholder-[text-gray-400] bg-transparent" />
              </template>
            </template>

            <!-- 查看模式 -->
            <template v-else>
              <span :class="['text-sm', form[field.model] 
              ? 'text-[var(--color-primary-black)]' 
              : 'text-gray-400']">{{form[field.model] || '未填寫'}}</span>
            </template>
          </div>

          <!-- 錯誤訊息 -->
          <p v-if="errors[field.model]" class="text-[var(--color-primary-orange)] text-xs mt-1 ml-1">
            {{ errors[field.model] }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>