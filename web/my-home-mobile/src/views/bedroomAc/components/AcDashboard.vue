<template>
  <div class="px-5 mb-6">
    <div
      class="rounded-3xl px-6 py-6 shadow-custom transition-all duration-500"
      :class="power ? 'storage-gradient' : 'bg-muted'"
    >
      <!-- Top: temperature display + status -->
      <div class="flex items-start justify-between mb-5">
        <div>
          <div
            class="text-xs font-medium mb-1"
            :class="power ? 'text-white/60' : 'text-muted-foreground'"
          >
            设定温度
          </div>
          <div
            class="text-7xl font-bold leading-none tracking-tight"
            :class="power ? 'text-white' : 'text-muted-foreground'"
          >
            {{ setTemp }}
            <span
              class="text-3xl font-semibold ml-1"
              :class="power ? 'text-white/70' : 'text-muted-foreground/70'"
            >°C</span>
          </div>
        </div>
        <div class="flex flex-col items-end gap-1.5">
          <div
            class="text-xs font-semibold px-2 py-0.5 rounded-full"
            :class="
              power
                ? 'bg-white/15 text-white/80'
                : 'bg-muted-foreground/10 text-muted-foreground/60'
            "
          >
            {{ power ? '运行中' : '已关闭' }}
          </div>
          <div
            class="text-xs font-medium"
            :class="power ? 'text-white/50' : 'text-muted-foreground/40'"
          >
            室温 {{ roomTemp !== null ? `${roomTemp}°C` : '--' }}
          </div>
          <div
            class="text-xs font-medium"
            :class="power ? 'text-white/50' : 'text-muted-foreground/40'"
          >
            湿度 {{ roomHumidity !== null ? `${roomHumidity}%` : '--' }}
          </div>
        </div>
      </div>

      <!-- Mode / Wind / Timer info -->
      <div
        class="grid grid-cols-3 gap-3 pt-4 border-t"
        :class="power ? 'border-white/15' : 'border-muted-foreground/10'"
      >
        <div class="flex flex-col items-center gap-1">
          <ThermometerIcon
            :size="14"
            :class="power ? 'text-white/50' : 'text-muted-foreground/40'"
            :stroke-width="2"
          />
          <span
            class="text-[10px] font-medium"
            :class="power ? 'text-white/50' : 'text-muted-foreground/40'"
          >模式</span>
          <span
            class="text-xs font-bold"
            :class="power ? 'text-white' : 'text-muted-foreground'"
          >{{ modeLabel }}</span>
        </div>
        <div class="flex flex-col items-center gap-1">
          <GaugeIcon
            :size="14"
            :class="power ? 'text-white/50' : 'text-muted-foreground/40'"
            :stroke-width="2"
          />
          <span
            class="text-[10px] font-medium"
            :class="power ? 'text-white/50' : 'text-muted-foreground/40'"
          >风速</span>
          <span
            class="text-xs font-bold"
            :class="power ? 'text-white' : 'text-muted-foreground'"
          >{{ windSpeedLabel }}</span>
        </div>
        <div class="flex flex-col items-center gap-1">
          <TimerIcon
            :size="14"
            :class="power ? 'text-white/50' : 'text-muted-foreground/40'"
            :stroke-width="2"
          />
          <span
            class="text-[10px] font-medium"
            :class="power ? 'text-white/50' : 'text-muted-foreground/40'"
          >定时</span>
          <span
            class="text-xs font-bold"
            :class="power ? 'text-white' : 'text-muted-foreground'"
          >{{ timerSummary }}</span>
        </div>
      </div>

      <!-- Active timer detail -->
      <div
        v-if="offTimer > 0 || onTimer > 0"
        class="mt-3 pt-3 border-t flex items-center gap-1.5"
        :class="
          power
            ? 'border-white/15 text-white/70'
            : 'border-muted-foreground/10 text-muted-foreground/60'
        "
      >
        <TimerIcon :size="12" :stroke-width="2" />
        <span class="text-xs font-medium">{{ timerDetail }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ThermometerIcon, GaugeIcon, TimerIcon } from 'lucide-vue-next'
import { MODE_MAP, WIND_SPEED_MAP, minutesToTime } from '../constants'

const props = defineProps<{
  power: boolean
  setTemp: number
  mode: string
  windSpeed: string
  offTimer: number
  onTimer: number
  roomTemp: number | null
  roomHumidity: number | null
}>()

const modeLabel = computed(() => MODE_MAP[props.mode] || props.mode)
const windSpeedLabel = computed(() => WIND_SPEED_MAP[props.windSpeed] || props.windSpeed)

const timerSummary = computed(() => {
  const hasOff = props.offTimer > 0
  const hasOn = props.onTimer > 0
  if (hasOff && hasOn) return `${minutesToTime(props.offTimer)} / ${minutesToTime(props.onTimer)}`
  if (hasOff) return `${minutesToTime(props.offTimer)} 关`
  if (hasOn) return `${minutesToTime(props.onTimer)} 开`
  return '未设置'
})

const timerDetail = computed(() => {
  const parts: string[] = []
  if (props.offTimer > 0) parts.push(`${minutesToTime(props.offTimer)} 关机`)
  if (props.onTimer > 0) parts.push(`${minutesToTime(props.onTimer)} 开机`)
  return parts.join(' · ')
})
</script>
