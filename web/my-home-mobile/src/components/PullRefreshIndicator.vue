<script setup lang="ts">
import { computed } from 'vue'
import { RefreshCwIcon } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  pulling?: boolean
  refreshing?: boolean
  pullDistance?: number
  threshold?: number
}>(), {
  pulling: false,
  refreshing: false,
  pullDistance: 0,
  threshold: 72,
})

const progress = computed(() => Math.min(props.pullDistance / props.threshold, 1))
const rotation = computed(() => progress.value * 180)
const visible = computed(() => props.pulling || props.refreshing)
</script>

<template>
  <div
    class="absolute left-0 right-0 flex items-center justify-center pointer-events-none z-30 transition-all duration-200"
    :style="{
      top: 0,
      height: visible ? `${Math.max(pullDistance, refreshing ? 52 : 0)}px` : '0px',
      overflow: 'hidden',
      opacity: visible ? 1 : 0,
    }"
  >
    <div
      class="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border shadow-custom"
      :style="{ opacity: Math.max(progress, refreshing ? 1 : 0) }"
    >
      <RefreshCwIcon
        :size="15"
        :stroke-width="2.5"
        class="text-primary transition-transform"
        :class="{ 'animate-spin': refreshing }"
        :style="{ transform: refreshing ? undefined : `rotate(${rotation}deg)` }"
      />
      <span class="text-xs font-semibold text-primary">
        {{ refreshing ? '刷新中...' : progress >= 1 ? '释放刷新' : '下拉刷新' }}
      </span>
    </div>
  </div>
</template>
