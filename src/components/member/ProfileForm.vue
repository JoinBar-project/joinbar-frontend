<script setup>
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
  </div>
</template>