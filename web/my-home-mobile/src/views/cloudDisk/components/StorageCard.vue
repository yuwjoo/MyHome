<!--
  存储空间卡片组件
  展示云盘已用/总空间及使用百分比
-->
<template>
  <div class="storage-gradient rounded-2xl px-4 py-3 shadow-custom">
    <div class="flex items-center justify-between">
      <!-- 左侧：云盘图标 + 用量 -->
      <div class="flex items-center gap-2.5">
        <div class="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <CloudIcon :size="14" class="text-white" :stroke-width="2" />
        </div>
        <div>
          <div class="text-white text-sm font-bold leading-none">
            {{ usedGb }}
            <span class="text-xs font-normal opacity-70">GB</span>
          </div>
          <div class="text-white/60 text-xs mt-0.5">/ {{ totalGb }} GB</div>
        </div>
      </div>
      <!-- 右侧：百分比标签 -->
      <span class="text-white text-xs font-medium bg-white/20 px-2.5 py-1 rounded-full">
        {{ percent }}% 已用
      </span>
    </div>
    <!-- 进度条 -->
    <div class="h-1.5 bg-white/20 rounded-full overflow-hidden mt-3">
      <div
        class="h-full bg-white rounded-full storage-bar"
        :style="{ '--fill-pct': `${percent}%`, width: `${percent}%` }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { CloudIcon } from 'lucide-vue-next'

defineProps<{
  /** 已用存储空间（GB） */
  usedGb: number
  /** 总存储空间（GB） */
  totalGb: number
  /** 已用百分比 */
  percent: number
}>()
</script>
