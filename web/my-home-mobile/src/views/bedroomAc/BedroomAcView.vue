<template>
  <div
    data-cmp="BedroomAcView"
    class="min-h-screen bg-background flex flex-col max-w-md mx-auto pb-10"
  >
    <!-- Sending indicator -->
    <SendingIndicator :visible="sending" />

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
    <AcDashboard
      :power="ac.state.value.power"
      :set-temp="ac.state.value.temperature"
      :mode="ac.state.value.mode"
      :wind-speed="ac.state.value.windSpeed"
      :off-timer="ac.state.value.offTimer"
      :on-timer="ac.state.value.onTimer"
      :room-temp="temperature"
      :room-humidity="humidity"
    />

    <!-- Control Buttons -->
    <div class="px-5">
      <AcControlGrid
        :power="ac.state.value.power"
        :off-timer="ac.state.value.offTimer"
        :on-timer="ac.state.value.onTimer"
        :is-offline="isOffline"
        :sending="sending"
        @toggle-power="withSending(() => ac.togglePower())"
        @increase-temp="withSending(() => ac.increaseTemperature())"
        @decrease-temp="withSending(() => ac.decreaseTemperature())"
        @cancel-timer="withSending(() => handleCancelTimer())"
        @open-timer-sheet="showTimerSheet = true"
      />
    </div>

    <!-- Timer Bottom Sheet -->
    <TimerSheet
      :show="showTimerSheet"
      @close="showTimerSheet = false"
      @confirm="(minutes: number) => withSending(() => handleTimerConfirm(minutes))"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { toast } from 'vue-sonner'
import { useAcControl } from './composables/useAcControl'
import { useSensorData } from './composables/useSensorData'
import { useDeviceOnline } from './composables/useDeviceOnline'
import { formatMinutes } from './constants'
import AcDashboard from './components/AcDashboard.vue'
import AcControlGrid from './components/AcControlGrid.vue'
import TimerSheet from './components/TimerSheet.vue'
import SendingIndicator from './components/SendingIndicator.vue'

const SENDING_TIMEOUT = 30_000 // 30 秒超时

const ac = useAcControl()
const sensor = useSensorData()
const deviceOnline = useDeviceOnline()

const { isOffline, isOnline, statusLabel } = deviceOnline
const { temperature, humidity } = sensor

const showTimerSheet = ref(false)
const sending = ref(false)
let sendingTimer: ReturnType<typeof setTimeout> | null = null

/**
 * 收到 AC 状态更新时，取消发送中状态
 */
watch(ac.state, () => {
  if (!sending.value) return
  if (sendingTimer) clearTimeout(sendingTimer)
  sendingTimer = null
  sending.value = false
})

/**
 * 包裹指令调用，开启发送中状态并设置 30 秒超时
 */
function withSending(action: () => void) {
  if (isOffline.value) return
  sending.value = true
  if (sendingTimer) clearTimeout(sendingTimer)
  sendingTimer = setTimeout(() => { sending.value = false }, SENDING_TIMEOUT)
  action()
}

onUnmounted(() => {
  if (sendingTimer) clearTimeout(sendingTimer)
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

function handleTimerConfirm(minutes: number) {
  ac.setOffTimer(minutes)
  showTimerSheet.value = false
  toast.success(`定时已设为 ${formatMinutes(minutes)} 后关机`)
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
