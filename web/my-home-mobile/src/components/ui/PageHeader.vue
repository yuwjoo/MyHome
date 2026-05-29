<script setup lang="ts">
/**
 * PageHeader.vue —— 通用页面顶部导航栏
 * @props title - 主标题
 * @props subtitle - 副标题（可选）
 * @props backable - 是否显示返回按钮
 * @emits back - 点击返回
 */
import { ChevronLeftIcon } from 'lucide-vue-next'

defineProps<{
  title: string
  subtitle?: string
  backable?: boolean
}>()

defineEmits<{
  (e: 'back'): void
}>()
</script>

<template>
  <header class="px-5 pt-10 pb-4">
    <div class="flex items-center gap-3">
      <button
        v-if="backable"
        class="w-9 h-9 flex items-center justify-center rounded-2xl bg-card border border-border shadow-custom"
        @click="$emit('back')"
      >
        <ChevronLeftIcon :size="18" class="text-foreground" :stroke-width="2.5" />
      </button>
      <div class="flex-1">
        <div v-if="subtitle" class="text-xs text-muted-foreground font-medium">{{ subtitle }}</div>
        <div class="text-xl font-bold text-foreground">{{ title }}</div>
        <!-- 额外插槽，供子页面放额外按钮/信息 -->
        <slot name="extra" />
      </div>
      <slot name="actions" />
    </div>
    <!-- 搜索/其他内容插槽 -->
    <slot />
  </header>
</template>
