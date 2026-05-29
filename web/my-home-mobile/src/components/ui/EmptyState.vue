<script setup lang="ts">
/**
 * EmptyState.vue —— 通用空状态占位
 * @props icon - Lucide 图标组件
 * @props title - 提示文字
 * @props description - 描述文字（可选）
 */
import type { Component } from 'vue'

defineProps<{
  icon: Component
  title: string
  description?: string
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 text-muted-foreground">
    <component :is="icon" :size="36" :stroke-width="1.5" class="mb-3 opacity-30" />
    <div class="text-sm font-medium">{{ title }}</div>
    <div v-if="description" class="text-xs mt-1 opacity-60">{{ description }}</div>
  </div>
</template>
