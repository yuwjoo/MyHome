<script setup lang="ts">
/**
 * ExpressSummaryCard.vue —— 快递数量统计卡片
 */
import type { ExpressItem } from '@/types'

const props = defineProps<{
  list: ExpressItem[]
}>()

const arrivedCount  = computed(() => props.list.filter((e) => e.status === 'arrived').length)
const arrivingCount = computed(() => props.list.filter((e) => e.status === 'arriving').length)
</script>

<script lang="ts">
import { computed } from 'vue'
</script>

<template>
  <div class="storage-gradient rounded-3xl p-5 shadow-custom">
    <div class="flex items-center justify-between">
      <div>
        <div class="text-white/80 text-xs font-medium mb-1">待取件</div>
        <div class="text-white text-3xl font-bold">{{ arrivedCount }}</div>
        <div class="text-white/60 text-xs mt-0.5">件包裹等你去拿</div>
      </div>
      <div class="flex flex-col gap-2 items-end">
        <div class="flex items-center gap-2 bg-white/10 rounded-2xl px-3 py-1.5">
          <div class="w-2 h-2 rounded-full bg-emerald-400" />
          <span class="text-white/90 text-xs">已到达 {{ arrivedCount }} 件</span>
        </div>
        <div class="flex items-center gap-2 bg-white/10 rounded-2xl px-3 py-1.5">
          <div class="w-2 h-2 rounded-full bg-amber-400" />
          <span class="text-white/90 text-xs">派送中 {{ arrivingCount }} 件</span>
        </div>
      </div>
    </div>
  </div>
</template>
