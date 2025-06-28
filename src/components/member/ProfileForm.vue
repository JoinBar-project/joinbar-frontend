<script setup>
const props = defineProps({
  form: Object,
  isEdit: Boolean,
  barTypes: Array,
  barMoods: Array,
  profileFields: Array,
  toggleSelection: Function,
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
            : 'border-gray-300']">
            <i :class="[field.icon, 'text-gray-400 mr-2']" />
            <template v-if="isEdit">
              <input
                :id="field.model"
                :type="field.type"
                v-model="form[field.model]"
                :placeholder="field.placeholder"
                class="w-full outline-none text-sm text-[var(--color-primary-black)] placeholder-[text-gray-400] bg-transparent"
                :readonly="!isEdit" />
            </template>
            <template v-else>
              <span :class="['text-sm', form[field.model] 
              ? 'text-[var(--color-primary-black)]' 
              : 'text-gray-400']">{{form[field.model] || '未填寫'}}</span>
            </template>
          </div>
          <p v-if="errors[field.model]" class="text-[var(--color-primary-orange)] text-xs mt-1 ml-1">
            {{ errors[field.model] }}
          </p>
        </div>
      </div>
    </div>

    <div class="mt-8 space-y-4">
      <h2 class="text-xl font-semibold mb-4 text-[var(--color-primary-orange)]">酒吧偏好</h2>
      <div>
        <h3 class="text-base font-semibold mb-3 text-[var(--color-secondary-green)]">選擇你喜歡的酒吧類型</h3>
        <div class="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3">
          <button
            type="button"
            v-for="type in barTypes"
            :key="type"
            @click="isEdit && toggleSelection(form.preferences.types, type.label)"
            :class="[
              'text-xs md:text-sm py-3 px-2 rounded-lg border transition-all duration-200 flex flex-col items-center justify-center min-h-[75px] md:min-h-[80px] hover:scale-105 cursor-pointer',
              form.preferences?.types?.includes(type.label)
                ? 'bg-[var(--color-primary-orange)] text-white border-[var(--color-primary-orange)] shadow-md'
                : 'bg-[var(--color-icon-secondary)] text-[var(--color-black)] border-[var(--color-icon-secondary)] hover:bg-gray-300',
            ]">
            <i :class="[type.icon, 'text-base md:text-lg mb-1']"></i>
            <span class="font-medium leading-tight text-center">{{ type.label }}</span>
          </button>
        </div>
      </div>

      <div>
        <h3 class="text-base font-semibold mb-3 text-[var(--color-secondary-green)]">選擇你喜歡的酒吧氛圍</h3>
        <div class="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3">
          <button
            type="button"
            v-for="mood in barMoods"
            :key="mood"
            @click="isEdit && toggleSelection(form.preferences.moods, mood.label)"
            :class="[
              'text-xs md:text-sm py-3 px-2 rounded-lg border transition-all duration-200 flex flex-col items-center justify-center min-h-[75px] md:min-h-[80px] hover:scale-105 cursor-pointer',
              form.preferences?.moods?.includes(mood.label)
                ? 'bg-[var(--color-primary-orange)] text-white border-[var(--color-primary-orange)] shadow-md'
                : 'bg-[var(--color-icon-secondary)] text-[var(--color-black)] border-[var(--color-icon-secondary)] hover:bg-gray-300',
            ]">
            <i :class="[mood.icon, 'text-base md:text-lg mb-1']"></i>
            <span class="font-medium leading-tight text-center">{{ mood.label }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
