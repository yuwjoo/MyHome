<script setup lang="ts">
/**
 * ProfileMenuList.vue —— 个人页菜单列表
 */
import {
  ChevronRightIcon,
  HelpCircleIcon,
  InfoIcon,
  SettingsIcon,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const MENU_ITEMS = [
  { icon: HelpCircleIcon, label: '帮助与反馈', color: 'text-cyan-500',          bg: 'bg-cyan-50'    },
  { icon: InfoIcon,       label: '关于',       color: 'text-primary',           bg: 'bg-primary/10' },
  { icon: SettingsIcon,   label: '设置',       color: 'text-muted-foreground',  bg: 'bg-muted'      },
]
</script>

<template>
  <div class="bg-card rounded-3xl border border-border shadow-custom overflow-hidden">
    <button
      v-for="(item, idx) in MENU_ITEMS"
      :key="item.label"
      class="w-full flex items-center gap-4 px-5 py-4.5 active:bg-muted transition-colors"
      :class="{ 'border-b border-border': idx < MENU_ITEMS.length - 1 }"
      @click="item.action ? item.action() : toast.info(item.label)"
    >
      <div class="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" :class="item.bg">
        <component :is="item.icon" :size="18" :class="item.color" :stroke-width="2" />
      </div>
      <span class="flex-1 text-left text-sm font-semibold text-foreground">{{ item.label }}</span>
      <ChevronRightIcon :size="15" class="text-muted-foreground" :stroke-width="2" />
    </button>
  </div>
</template>
