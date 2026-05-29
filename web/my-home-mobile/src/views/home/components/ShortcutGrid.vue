<script setup lang="ts">
/**
 * ShortcutGrid.vue —— 快捷入口网格
 */
import { toast } from 'vue-sonner'
import {
  CarIcon,
  GamepadIcon,
  BikeIcon,
  RatIcon,
  WifiIcon,
  ZapIcon,
} from 'lucide-vue-next'

const SHORTCUT_CARDS = [
  { id: 's1', icon: CarIcon,    label: '小车遥控', color: 'bg-primary/10 text-primary',         badge: ''   },
  { id: 's2', icon: GamepadIcon, label: '小游戏',  color: 'bg-emerald-100 text-emerald-600',     badge: 'NEW' },
  { id: 's3', icon: BikeIcon,   label: '小电驴',   color: 'bg-amber-100 text-amber-600',         badge: ''   },
  { id: 's4', icon: RatIcon,    label: '仓鼠监控', color: 'bg-rose-100 text-rose-500',           badge: '在线' },
  { id: 's5', icon: WifiIcon,   label: '网络状态', color: 'bg-cyan-100 text-cyan-600',           badge: ''   },
  { id: 's6', icon: ZapIcon,    label: '用电统计', color: 'bg-purple-100 text-purple-600',       badge: ''   },
]
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-3">
      <span class="text-sm font-bold text-foreground">快捷入口</span>
    </div>
    <div class="flex flex-wrap gap-3">
      <button
        v-for="card in SHORTCUT_CARDS"
        :key="card.id"
        class="w-[calc(33.333%-8px)] aspect-square bg-card rounded-2xl flex flex-col items-center justify-center gap-2 shadow-custom border border-border active:scale-95 transition-transform relative"
        @click="toast.info(`打开${card.label}`)"
      >
        <div class="w-10 h-10 rounded-xl flex items-center justify-center" :class="card.color">
          <component :is="card.icon" :size="18" :stroke-width="2" />
        </div>
        <span class="text-[11px] font-semibold text-foreground">{{ card.label }}</span>
        <span
          v-if="card.badge"
          class="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
          :class="card.badge === '在线' ? 'bg-emerald-500 text-white' : 'bg-primary text-primary-foreground'"
        >
          {{ card.badge }}
        </span>
      </button>
    </div>
  </div>
</template>
