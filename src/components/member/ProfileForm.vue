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
  <div class="space-y-4 w-full">
    <div class="flex flex-col items-center md:items-start w-full">
      <div v-for="(field, index) in profileFields" :key="index" class="mb-4">
        <label :for="field.model" class="block text-sm font-semibold text-gray-700 mb-1">
          {{ field.label }}
        </label>
        <div class="w-64">
          <div class="flex items-center border rounded px-3 py-2 w-64 bg-white"
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

    <div class="space-y-4 mt-8">
      <h2 class="text-xl font-semibold mb-4 text-[#860914]">酒吧偏好</h2>

      <div>
        <h3 class="text-lg font-medium mb-2 text-[#aa666c]">酒吧類型</h3>
        <div class="grid grid-cols-3 gap-3">
          <button
            type="button"
            v-for="type in barTypes"
            :key="type"
            @click="isEdit && toggleSelection(form.preferences.types, type)"
            :class="[
              'text-sm py-2 rounded-full border transition duration-200 cursor-pointer',
              form.preferences?.types?.includes(type)
              ? 'bg-[#860914] text-white border-[#860914]'
              : 'bg-[#3A3435] text-[#f8ecec] border-[#3A3435]',
            ]">{{ type }}
          </button>
        </div>
      </div>

      <div>
        <h3 class="text-lg font-medium mb-2 text-[#aa666c]">酒吧氛圍</h3>
        <div class="grid grid-cols-3 gap-2">
          <button
            type="button"
            v-for="mood in barMoods"
            :key="mood"
            @click="isEdit && toggleSelection(form.preferences.moods, mood)"
            :class="[
              'text-sm py-2 rounded-full border transition duration-200 cursor-pointer',
              form.preferences?.moods?.includes(mood)
              ? 'bg-[#860914] text-white border-[#860914]'
              : 'bg-[#3A3435] text-[#f8ecec] border-[#3A3435]',
            ]">
            {{ mood }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
