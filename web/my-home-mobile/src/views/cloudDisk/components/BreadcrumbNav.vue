<!--
  面包屑导航组件
  展示当前文件夹路径并支持点击跳转
-->
<template>
  <div class="flex items-center gap-1 px-5 py-2 overflow-x-auto">
    <div
      v-for="(item, index) in (items ?? [{ label: '全部文件', path: '/' }])"
      :key="item.path"
      class="flex items-center gap-1 flex-shrink-0"
    >
      <HomeIcon v-if="index === 0" :size="12" class="text-muted-foreground mr-0.5" :stroke-width="2" />
      <button
        @click="index !== (items ?? []).length - 1 && emit('navigate', item.path)"
        class="text-xs font-medium px-2.5 py-1.5 rounded-xl transition-colors"
        :class="index === (items ?? []).length - 1
          ? 'text-primary bg-secondary cursor-default'
          : 'text-muted-foreground active:bg-muted'"
      >
        {{ item.label }}
      </button>
      <ChevronRightIcon
        v-if="index !== (items ?? []).length - 1"
        :size="12"
        class="text-muted-foreground/60"
        :stroke-width="2"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronRightIcon, HomeIcon } from 'lucide-vue-next'
import type { BreadcrumbItem } from '@/types'

defineProps<{
  /** 面包屑路径项列表，每个项包含标签和路径 */
  items?: BreadcrumbItem[]
}>()

const emit = defineEmits<{
  /** 点击面包屑项时触发，传递目标路径 */
  navigate: [path: string]
}>()
</script>
