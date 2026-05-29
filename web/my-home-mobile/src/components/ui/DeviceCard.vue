<script setup lang="ts">
/**
 * DeviceCard.vue —— 智能设备卡片（首页 & 设备页共用）
 * @props device - 设备数据
 * @emits toggle - 切换开关
 * @emits click - 点击卡片主体（如空调跳转遥控）
 */
import { computed } from 'vue'
import type { SmartDevice } from '@/types'
import { DEVICE_ICON_MAP, DEVICE_COLORS, DEVICE_LABELS } from '@/constants'
import ToggleSwitch from './ToggleSwitch.vue'

const props = defineProps<{
  device: SmartDevice
  /** 是否显示设备类型标签（设备列表页用） */
  showLabel?: boolean
  /** 是否显示房间信息（设备列表页用） */
  showRoom?: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle', id: string): void
  (e: 'click', device: SmartDevice): void
}>()

const iconComponent = computed(() => DEVICE_ICON_MAP[props.device.type])
const colorClass = computed(() =>
  props.device.isOn ? DEVICE_COLORS[props.device.type].on : DEVICE_COLORS[props.device.type].off,
)
</script>

<template>
  <div
    class="flex flex-col bg-card rounded-2xl p-4 shadow-custom border transition-all"
    :class="[
      device.isOn ? 'border-primary/20' : 'border-border',
      device.type === 'ac' ? 'cursor-pointer active:scale-95 transition-transform' : '',
    ]"
    @click="emit('click', device)"
  >
    <!-- 顶部行：图标 + 开关 -->
    <div class="flex items-start justify-between mb-3">
      <!-- 图标 -->
      <div
        class="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
        :class="colorClass"
      >
        <component :is="iconComponent" :size="18" :stroke-width="2" />
      </div>

      <!-- 开关 -->
      <ToggleSwitch
        :model-value="device.isOn"
        @update:model-value="emit('toggle', device.id)"
      />
    </div>

    <!-- 名称 -->
    <div class="text-sm font-semibold text-foreground leading-tight mb-0.5">
      {{ device.name }}
    </div>

    <!-- 状态值 & 房间 -->
    <div class="flex items-center justify-between mt-0.5">
      <span v-if="showRoom" class="text-[11px] text-muted-foreground">{{ device.room }}</span>
      <span
        class="text-[11px] font-medium"
        :class="device.isOn ? 'text-primary' : 'text-muted-foreground'"
      >
        {{ device.isOn ? device.value : '已关闭' }}
      </span>
    </div>

    <!-- 类型标签 -->
    <div v-if="showLabel" class="mt-2 pt-2 border-t border-border/50">
      <span class="text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wide">
        {{ DEVICE_LABELS[device.type] }}
      </span>
    </div>
  </div>
</template>
