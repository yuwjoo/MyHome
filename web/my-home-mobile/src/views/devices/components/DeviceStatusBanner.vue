<script setup lang="ts">
/**
 * DeviceStatusBanner.vue —— 设备状态横幅（渐变卡片）
 */
import { ZapIcon } from 'lucide-vue-next'

defineProps<{
  onCount: number
  totalCount: number
  allOn: boolean
}>()

defineEmits<{
  (e: 'toggleAll'): void
}>()
</script>

<template>
  <div class="storage-gradient rounded-2xl px-4 py-3 flex items-center justify-between shadow-custom">
    <div class="flex items-center gap-2">
      <div class="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
        <ZapIcon :size="16" class="text-white" :stroke-width="2" />
      </div>
      <div>
        <div class="text-white text-sm font-bold">{{ onCount }} / {{ totalCount }} 台运行中</div>
        <div class="text-white/60 text-[11px]">点击开关可控制设备</div>
      </div>
    </div>
    <button
      class="px-3 py-1.5 rounded-xl bg-white/20 text-white text-xs font-semibold active:scale-95 transition-transform"
      @click="$emit('toggleAll')"
    >
      {{ allOn ? '全部关闭' : '全部开启' }}
    </button>
  </div>
</template>
