<script setup>
const props = defineProps({
  form: Object,
  isEdit: Boolean,
  barTypes: Array,
  barMoods: Array,
  profileFields: Array,
  toggleSelection: Function,
});
</script>

<template>
  <div class="space-y-4 w-full max-w-md mx-auto mt-8">
    <div v-for="(field, index) in profileFields" :key="index" class="flex items-center border border-gray-300 rounded px-3 py-2 mb-3 bg-white">
      <i :class="field.icon" class="text-gray-400 mr-2"></i>
      <template v-if="isEdit">
        <input
          :type="field.type"
          v-model="form[field.model]"
          :placeholder="field.placeholder"
          class="w-full outline-none text-[#860914] placeholder-[#860914] bg-transparent" />
      </template>
      <template v-else>
        <span class="text-[#860914]">{{ form[field.model] || '未填寫' }}</span>
      </template>
    </div>

    <div class="space-y-4 mt-6">
      <h2 class="text-xl font-semibold mb-4 text-[#860914]">酒吧偏好</h2>

      <div>
        <h3 class="text-lg font-medium mb-2 text-[#aa666c]">酒吧類型</h3>
        <div class="grid grid-cols-3 grid-rows-2 gap-3">
          <button
            type="button"
            v-for="type in barTypes"
            :key="type"
            @click="isEdit && toggleSelection(form.preferences.types, type)"
            :class="[
              'text-sm py-2 rounded-full border transition duration-200 cursor-pointer',
              form.preferences?.types?.includes(type) ? 'bg-[#860914] text-white border-[#860914]' : 'bg-[#3A3435] text-[#f8ecec] border-[#3A3435]',
            ]">
            {{ type }}
          </button>
        </div>
      </div>

      <div>
        <h3 class="text-lg font-medium mb-2 text-[#aa666c]">酒吧氛圍</h3>
        <div class="grid grid-cols-3 grid-rows-2 gap-2">
          <button
            type="button"
            v-for="mood in barMoods"
            :key="mood"
            @click="isEdit && toggleSelection(form.preferences.moods, mood)"
            :class="[
              'text-sm py-2 rounded-full border transition duration-200 cursor-pointer',
              form.preferences?.moods?.includes(mood) ? 'bg-[#860914] text-white border-[#860914]' : 'bg-[#3A3435] text-[#f8ecec] border-[#3A3435]',
            ]">
            {{ mood }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
