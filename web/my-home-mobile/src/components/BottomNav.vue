<script setup lang="ts">
import { useRoute } from 'vue-router'
import { HomeIcon, CloudIcon, UserIcon, RouterIcon } from 'lucide-vue-next'

const route = useRoute()

const NAV_ITEMS = [
  { path: '/bedroom-ac', label: '首页',  Icon: HomeIcon    },
  { path: '/lan',        label: '设备',  Icon: RouterIcon  },
  { path: '/cloud',      label: '云盘',  Icon: CloudIcon   },
  { path: '/profile',    label: '我的',  Icon: UserIcon    },
]
</script>

<template>
  <div data-cmp="BottomNav" class="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 px-4 w-full max-w-sm">
    <nav class="flex items-center bg-card/95 backdrop-blur-md border border-border shadow-custom rounded-full px-2 py-2 gap-1">
      <RouterLink
        v-for="{ path, label, Icon } in NAV_ITEMS"
        :key="path"
        :to="path"
        class="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 px-1 rounded-full transition-all"
        :class="route.path === path
          ? 'bg-primary text-primary-foreground shadow-custom'
          : 'text-muted-foreground hover:text-foreground'"
      >
        <component :is="Icon" :size="18" :stroke-width="route.path === path ? 2.5 : 2" />
        <span
          class="text-[10px] font-semibold leading-none"
          :class="{ 'text-primary-foreground': route.path === path }"
        >
          {{ label }}
        </span>
      </RouterLink>
    </nav>
  </div>
</template>
