<!--
  布局切换组件
  在列表模式和宫格模式之间切换
-->
<template>
  <div class="flex items-center gap-1 bg-card border border-border rounded-xl p-1 shadow-custom">
    <button
      @click="emit('update:modelValue', 'list')"
      class="flex items-center justify-center w-8 h-6 rounded-lg transition-all"
      :class="
        modelValue === 'list'
          ? 'bg-primary text-primary-foreground shadow-custom'
          : 'text-muted-foreground'
      "
    >
      <LayoutListIcon :size="13" :stroke-width="2" />
    </button>
    <button
      @click="emit('update:modelValue', 'grid')"
      class="flex items-center justify-center w-8 h-6 rounded-lg transition-all"
      :class="
        modelValue === 'grid'
          ? 'bg-primary text-primary-foreground shadow-custom'
          : 'text-muted-foreground'
      "
    >
      <LayoutGridIcon :size="13" :stroke-width="2" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { LayoutListIcon, LayoutGridIcon } from 'lucide-vue-next'
import type { LayoutMode } from '@/types'

defineProps<{
  /** 当前布局模式 */
  modelValue: LayoutMode
}>()

const emit = defineEmits<{
  /** 切换布局模式 */
  'update:modelValue': [mode: LayoutMode]
}>()
</script>
