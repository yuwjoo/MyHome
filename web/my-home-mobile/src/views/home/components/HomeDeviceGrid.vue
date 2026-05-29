<script setup lang="ts">
/**
 * HomeDeviceGrid.vue —— 首页设备卡片网格（前 4 台）
 * @props devices - 设备列表
 * @emits toggle - 切换设备状态
 * @emits viewAll - 查看全部
 */
import { ChevronRightIcon } from 'lucide-vue-next'
import type { SmartDevice } from '@/types'
import DeviceCard from '@/components/ui/DeviceCard.vue'

defineProps<{
  devices: SmartDevice[]
}>()

const emit = defineEmits<{
  (e: 'toggle', id: string): void
  (e: 'viewAll'): void
  (e: 'cardClick', device: SmartDevice): void
}>()
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-3">
      <span class="text-sm font-bold text-foreground">设备控制</span>
      <button
        class="flex items-center gap-1 text-xs text-primary font-medium"
        @click="emit('viewAll')"
      >
        全部 <ChevronRightIcon :size="12" :stroke-width="2.5" />
      </button>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <DeviceCard
        v-for="device in devices.slice(0, 4)"
        :key="device.id"
        :device="device"
        @toggle="emit('toggle', $event)"
        @click="emit('cardClick', $event)"
      />
    </div>
  </div>
</template>
