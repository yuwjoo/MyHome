<script setup lang="ts">
/**
 * SceneGrid.vue —— 场景模式选择栏
 */
import { LockIcon, PlayIcon, PauseIcon } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

const SCENES = [
  { label: '离家模式', icon: LockIcon,  active: false },
  { label: '影院模式', icon: PlayIcon,  active: false },
  { label: '睡眠模式', icon: PauseIcon, active: true  },
]
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-3">
      <span class="text-sm font-bold text-foreground">场景模式</span>
    </div>
    <div class="flex gap-3">
      <button
        v-for="scene in SCENES"
        :key="scene.label"
        class="flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl border transition-all"
        :class="scene.active
          ? 'bg-primary/10 border-primary/30 text-primary'
          : 'bg-card border-border text-muted-foreground'"
        @click="toast.success(`已切换到${scene.label}`)"
      >
        <component :is="scene.icon" :size="18" :stroke-width="2" />
        <span class="text-[11px] font-semibold">{{ scene.label }}</span>
      </button>
    </div>
  </div>
</template>
