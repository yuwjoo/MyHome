<script setup lang="ts">
/**
 * ProfileStatsGrid.vue —— 设备/快递/云盘统计三宫格
 */
import { SmartphoneIcon, PackageIcon, CloudIcon } from 'lucide-vue-next'

const STATS = [
  { label: '设备', value: '8 台', icon: SmartphoneIcon, color: 'text-primary',      bg: 'bg-primary/10'   },
  { label: '快递', value: '3 件', icon: PackageIcon,    color: 'text-amber-500',    bg: 'bg-amber-50'     },
  { label: '云盘', value: '14 G', icon: CloudIcon,      color: 'text-emerald-500',  bg: 'bg-emerald-50'   },
]
</script>

<template>
  <div class="bg-card rounded-3xl shadow-custom border border-border p-5">
    <div class="flex items-stretch justify-around">
      <div v-for="stat in STATS" :key="stat.label" class="flex-1 flex flex-col items-center gap-2">
        <div class="w-11 h-11 rounded-2xl flex items-center justify-center" :class="stat.bg">
          <component :is="stat.icon" :size="20" :class="stat.color" :stroke-width="2" />
        </div>
        <div class="text-center">
          <div class="text-foreground text-base font-bold leading-tight">{{ stat.value }}</div>
          <div class="text-muted-foreground text-xs mt-0.5">{{ stat.label }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
