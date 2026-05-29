<script setup lang="ts">
/**
 * ToggleSwitch.vue —— 通用 iOS 风格开关组件
 * @props modelValue - 开关状态
 * @emits update:modelValue - 状态变更
 */
defineProps<{
  modelValue: boolean
}>()

defineEmits<{
  (e: 'update:modelValue', val: boolean): void
}>()
</script>

<template>
  <button
    class="relative w-10 h-5 rounded-full transition-all flex-shrink-0"
    :class="modelValue ? 'bg-primary' : 'bg-muted'"
    @click.stop="$emit('update:modelValue', !modelValue)"
  >
    <div
      class="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
      :class="modelValue ? 'left-5' : 'left-0.5'"
    />
  </button>
</template>
