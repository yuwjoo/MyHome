<template>
  <div
    data-cmp="BedroomAcView"
    class="min-h-screen bg-background flex flex-col max-w-md mx-auto pb-10"
  >
    <!-- Header -->
    <header class="px-5 pt-14 pb-4">
      <div class="text-xl font-bold text-foreground">主卧空调</div>
      <div class="flex items-center gap-1.5 mt-1">
        <span
          class="inline-block w-1.5 h-1.5 rounded-full"
          :class="statusColorClass"
        />
        <span class="text-xs" :class="statusTextClass">{{ statusLabel }}</span>
      </div>
    </header>

    <!-- Dashboard -->
    <div class="px-5 mb-6">
      <div
        class="rounded-3xl px-6 py-6 shadow-custom transition-all duration-500"
        :class="ac.state.value.power ? 'storage-gradient' : 'bg-muted'"
      >
        <!-- Top: room info + status badge -->
        <div class="flex items-start justify-between mb-5">
          <div>
            <div
              class="text-xs font-medium mb-1"
              :class="ac.state.value.power ? 'text-white/60' : 'text-muted-foreground'"
            >
              设定温度
            </div>
            <div
              class="text-7xl font-bold leading-none tracking-tight"
              :class="ac.state.value.power ? 'text-white' : 'text-muted-foreground'"
            >
              {{ ac.state.value.temperature }}
              <span
                class="text-3xl font-semibold ml-1"
                :class="ac.state.value.power ? 'text-white/70' : 'text-muted-foreground/70'"
              >°C</span>
            </div>
          </div>
          <div class="flex flex-col items-end gap-1.5">
            <div
              class="text-xs font-semibold px-2 py-0.5 rounded-full"
              :class="
                ac.state.value.power
                  ? 'bg-white/15 text-white/80'
                  : 'bg-muted-foreground/10 text-muted-foreground/60'
              "
            >
              {{ ac.state.value.power ? '运行中' : '已关闭' }}
            </div>
            <!-- 室温 & 湿度 -->
            <div
              class="text-xs font-medium"
              :class="ac.state.value.power ? 'text-white/50' : 'text-muted-foreground/40'"
            >
              室温 {{ temperature !== null ? `${temperature}°C` : '--' }}
            </div>
            <div
              class="text-xs font-medium"
              :class="ac.state.value.power ? 'text-white/50' : 'text-muted-foreground/40'"
            >
              湿度 {{ humidity !== null ? `${humidity}%` : '--' }}
            </div>
          </div>
        </div>

        <!-- Mode info -->
        <div
          class="grid grid-cols-3 gap-3 pt-4 border-t"
          :class="ac.state.value.power ? 'border-white/15' : 'border-muted-foreground/10'"
        >
          <div class="flex flex-col items-center gap-1">
            <ThermometerIcon
              :size="14"
              :class="ac.state.value.power ? 'text-white/50' : 'text-muted-foreground/40'"
              :stroke-width="2"
            />
            <span
              class="text-[10px] font-medium"
              :class="ac.state.value.power ? 'text-white/50' : 'text-muted-foreground/40'"
            >模式</span>
            <span
              class="text-xs font-bold"
              :class="ac.state.value.power ? 'text-white' : 'text-muted-foreground'"
            >{{ modeLabel }}</span>
          </div>
          <div class="flex flex-col items-center gap-1">
            <GaugeIcon
              :size="14"
              :class="ac.state.value.power ? 'text-white/50' : 'text-muted-foreground/40'"
              :stroke-width="2"
            />
            <span
              class="text-[10px] font-medium"
              :class="ac.state.value.power ? 'text-white/50' : 'text-muted-foreground/40'"
            >风速</span>
            <span
              class="text-xs font-bold"
              :class="ac.state.value.power ? 'text-white' : 'text-muted-foreground'"
            >{{ windSpeedLabel }}</span>
          </div>
          <div class="flex flex-col items-center gap-1">
            <TimerIcon
              :size="14"
              :class="ac.state.value.power ? 'text-white/50' : 'text-muted-foreground/40'"
              :stroke-width="2"
            />
            <span
              class="text-[10px] font-medium"
              :class="ac.state.value.power ? 'text-white/50' : 'text-muted-foreground/40'"
            >定时</span>
            <span
              class="text-xs font-bold"
              :class="ac.state.value.power ? 'text-white' : 'text-muted-foreground'"
            >{{ timerSummary }}</span>
          </div>
        </div>

        <!-- Active timer detail -->
        <div
          v-if="ac.state.value.offTimer > 0 || ac.state.value.onTimer > 0"
          class="mt-3 pt-3 border-t flex items-center gap-1.5"
          :class="
            ac.state.value.power
              ? 'border-white/15 text-white/70'
              : 'border-muted-foreground/10 text-muted-foreground/60'
          "
        >
          <TimerIcon :size="12" :stroke-width="2" />
          <span class="text-xs font-medium">{{ timerDetail }}</span>
        </div>
      </div>
    </div>

    <!-- Control Buttons -->
    <div class="px-5">
      <div class="grid grid-cols-2 gap-3">
        <!-- Power -->
        <button
          @click="ac.togglePower()"
          class="flex items-center gap-3 p-4 rounded-2xl border shadow-custom transition-all active:scale-95"
          :class="
            ac.state.value.power
              ? 'bg-cyan-500 border-transparent text-white'
              : 'bg-card border-border text-muted-foreground'
          "
          :disabled="isOffline"
        >
          <div
            class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            :class="ac.state.value.power ? 'bg-white/20' : 'bg-muted'"
          >
            <PowerIcon
              :size="18"
              :stroke-width="2.5"
              :class="ac.state.value.power ? 'text-white' : 'text-muted-foreground'"
            />
          </div>
          <div class="flex flex-col items-start">
            <span
              class="text-xs font-bold"
              :class="ac.state.value.power ? 'text-white' : 'text-foreground'"
            >开关机</span>
            <span
              class="text-[10px] mt-0.5"
              :class="ac.state.value.power ? 'text-white/70' : 'text-muted-foreground'"
            >{{ ac.state.value.power ? '点击关机' : '点击开机' }}</span>
          </div>
        </button>

        <!-- Temp - -->
        <button
          @click="ac.decreaseTemperature()"
          class="flex items-center gap-3 p-4 rounded-2xl border shadow-custom transition-all active:scale-95 bg-card border-border hover:border-primary/40"
          :disabled="!ac.state.value.power || isOffline"
          :class="
            !ac.state.value.power || isOffline
              ? 'opacity-40 cursor-not-allowed'
              : ''
          "
        >
          <div
            class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            :class="
              ac.state.value.power && !isOffline
                ? 'bg-cyan-100 text-cyan-500'
                : 'bg-muted text-muted-foreground'
            "
          >
            <MinusIcon :size="18" :stroke-width="2.5" />
          </div>
          <div class="flex flex-col items-start">
            <span class="text-xs font-bold text-foreground">降温</span>
            <span class="text-[10px] mt-0.5 text-muted-foreground">最低 16°C</span>
          </div>
        </button>

        <!-- Timer (cancel / set) -->
        <button
          v-if="ac.state.value.offTimer > 0 || ac.state.value.onTimer > 0"
          @click="handleCancelTimer"
          class="flex items-center gap-3 p-4 rounded-2xl border shadow-custom transition-all active:scale-95 bg-primary/10 border-primary/30"
          :disabled="isOffline"
          :class="isOffline ? 'opacity-40 cursor-not-allowed' : ''"
        >
          <div
            class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            :class="
              !isOffline
                ? 'bg-primary/20 text-primary'
                : 'bg-muted text-muted-foreground'
            "
          >
            <TimerOffIcon :size="18" :stroke-width="2" />
          </div>
          <div class="flex flex-col items-start">
            <span class="text-xs font-bold text-primary">取消定时</span>
            <span class="text-[10px] mt-0.5 text-primary/70">{{ timerDetail }}</span>
          </div>
        </button>
        <button
          v-else
          @click="openTimerSheet"
          class="flex items-center gap-3 p-4 rounded-2xl border shadow-custom transition-all active:scale-95 bg-card border-border hover:border-primary/40"
          :disabled="!ac.state.value.power || isOffline"
          :class="
            !ac.state.value.power || isOffline
              ? 'opacity-40 cursor-not-allowed'
              : ''
          "
        >
          <div
            class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            :class="
              ac.state.value.power && !isOffline
                ? 'bg-violet-100 text-violet-500'
                : 'bg-muted text-muted-foreground'
            "
          >
            <TimerIcon :size="18" :stroke-width="2" />
          </div>
          <div class="flex flex-col items-start">
            <span class="text-xs font-bold text-foreground">定时</span>
            <span class="text-[10px] mt-0.5 text-muted-foreground">设置定时关机</span>
          </div>
        </button>

        <!-- Temp + -->
        <button
          @click="ac.increaseTemperature()"
          class="flex items-center gap-3 p-4 rounded-2xl border shadow-custom transition-all active:scale-95 bg-card border-border hover:border-primary/40"
          :disabled="!ac.state.value.power || isOffline"
          :class="
            !ac.state.value.power || isOffline
              ? 'opacity-40 cursor-not-allowed'
              : ''
          "
        >
          <div
            class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            :class="
              ac.state.value.power && !isOffline
                ? 'bg-orange-100 text-orange-500'
                : 'bg-muted text-muted-foreground'
            "
          >
            <PlusIcon :size="18" :stroke-width="2.5" />
          </div>
          <div class="flex flex-col items-start">
            <span class="text-xs font-bold text-foreground">升温</span>
            <span class="text-[10px] mt-0.5 text-muted-foreground">最高 30°C</span>
          </div>
        </button>
      </div>
    </div>

    <!-- Timer Bottom Sheet -->
    <div v-if="showTimerSheet" class="fixed inset-0 z-50 flex flex-col justify-end">
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="showTimerSheet = false" />
      <div
        class="relative bg-background rounded-t-3xl px-5 pt-5 pb-10 shadow-xl max-w-md mx-auto w-full"
      >
        <div class="w-10 h-1 bg-muted-foreground/20 rounded-full mx-auto mb-5" />
        <div class="text-base font-bold text-foreground mb-1">设置定时</div>
        <div class="text-xs text-muted-foreground mb-5">选择多少时间后自动关机，最长 12 小时</div>

        <!-- 预设时间 -->
        <div class="grid grid-cols-5 gap-2 mb-6">
          <button
            v-for="min in TIMER_OPTIONS"
            :key="min"
            @click="timerDraft = min"
            class="py-2.5 rounded-2xl text-xs font-semibold border transition-all active:scale-95"
            :class="
              timerDraft === min
                ? 'bg-primary text-primary-foreground border-transparent shadow-custom'
                : 'bg-card border-border text-muted-foreground'
            "
          >
            {{ formatMinutes(min) }}
          </button>
        </div>
        <button
          @click="handleTimerConfirm"
          :disabled="timerDraft === null"
          class="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm active:scale-95 transition-all shadow-custom disabled:opacity-40"
        >
          确认设置
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  PowerIcon,
  PlusIcon,
  MinusIcon,
  TimerIcon,
  TimerOffIcon,
  ThermometerIcon,
  GaugeIcon,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import { useAcControl } from './composables/useAcControl'
import { useSensorData } from './composables/useSensorData'
import { useDeviceOnline } from './composables/useDeviceOnline'

const ac = useAcControl()
const sensor = useSensorData()
const deviceOnline = useDeviceOnline()

// 解包为顶层 ref，Vue 模板自动 unwrap
const { isOffline, isOnline, statusLabel } = deviceOnline
const { temperature, humidity } = sensor

// ── 定时器 ──
const TIMER_OPTIONS = Array.from({ length: 24 }, (_, i) => (i + 1) * 30) // 0.5h ~ 12h，步长 30min
const showTimerSheet = ref(false)
const timerDraft = ref(60)

const MODE_MAP: Record<string, string> = {
  cool: '制冷',
  heat: '制热',
  dry: '除湿',
  fan: '送风',
}
const WIND_SPEED_MAP: Record<string, string> = {
  auto: '自动',
  low: '低速',
  medium: '中速',
  high: '高速',
}

const modeLabel = computed(() => MODE_MAP[ac.state.value.mode] || ac.state.value.mode)
const windSpeedLabel = computed(() => WIND_SPEED_MAP[ac.state.value.windSpeed] || ac.state.value.windSpeed)

const timerSummary = computed(() => {
  if (ac.state.value.offTimer > 0) return formatMinutes(ac.state.value.offTimer)
  if (ac.state.value.onTimer > 0) return `${formatMinutes(ac.state.value.onTimer)}后开`
  return '未设置'
})

const timerDetail = computed(() => {
  if (ac.state.value.offTimer > 0) return `定时 ${formatMinutes(ac.state.value.offTimer)} 后关机`
  if (ac.state.value.onTimer > 0) return `定时 ${formatMinutes(ac.state.value.onTimer)} 后开机`
  return ''
})

const statusColorClass = computed(() => {
  if (isOnline.value) return 'bg-emerald-400'
  if (isOffline.value) return 'bg-red-400'
  return 'bg-gray-400'
})

const statusTextClass = computed(() => {
  if (isOnline.value) return 'text-emerald-500'
  if (isOffline.value) return 'text-red-400'
  return 'text-muted-foreground'
})

function formatMinutes(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h${m > 0 ? `${m}m` : ''}` : `${m}m`
}

function openTimerSheet() {
  if (isOffline.value) return
  timerDraft.value = 60
  showTimerSheet.value = true
}

function handleTimerConfirm() {
  if (timerDraft.value === null) return
  ac.setOffTimer(timerDraft.value)
  showTimerSheet.value = false
  toast.success(`定时已设为 ${formatMinutes(timerDraft.value)} 后关机`)
}

function handleCancelTimer() {
  if (ac.state.value.offTimer > 0) {
    ac.cancelOffTimer()
    toast.success('定时关机已取消')
  }
  if (ac.state.value.onTimer > 0) {
    ac.cancelOnTimer()
    toast.success('定时开机已取消')
  }
}
</script>
