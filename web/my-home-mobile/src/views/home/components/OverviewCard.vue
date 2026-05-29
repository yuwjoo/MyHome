<script setup lang="ts">
/**
 * OverviewCard.vue —— 设备总览渐变卡片
 * @props onCount - 运行中设备数
 * @props totalCount - 总设备数
 */
import { ZapIcon } from 'lucide-vue-next'

defineProps<{
  onCount: number
  totalCount: number
}>()
</script>

<template>
  <div class="storage-gradient rounded-3xl px-5 py-4 shadow-custom">
    <div class="flex items-center justify-between">
      <div>
        <div class="text-white/70 text-xs font-medium mb-0.5">设备总览</div>
        <div class="text-white text-3xl font-bold leading-tight">{{ onCount }}</div>
        <div class="text-white/60 text-xs mt-0.5">台运行中 · 共 {{ totalCount }} 台</div>
      </div>
      <div class="flex flex-col items-end gap-2">
        <div class="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
          <ZapIcon :size="22" class="text-white" :stroke-width="2" />
        </div>
        <div class="flex items-center gap-1.5">
          <div class="w-1.5 h-1.5 rounded-full bg-emerald-300" />
          <span class="text-white/70 text-[11px]">全部正常</span>
        </div>
      </div>
    </div>
  </div>
</template>
