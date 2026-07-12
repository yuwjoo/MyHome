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
        :wind-speed="ac.state.value.windSpeed"
        :off-timer="ac.state.value.offTimer"
        :on-timer="ac.state.value.onTimer"
        :is-offline="isOffline"
        :sending="sending"
        @toggle-power="withSending(() => ac.togglePower())"
        @toggle-wind-speed="withSending(() => ac.toggleWindSpeed())"
        @increase-temp="withSending(() => ac.increaseTemperature())"
        @decrease-temp="withSending(() => ac.decreaseTemperature())"
        @open-off-timer-sheet="showOffTimerSheet = true"
        @open-on-timer-sheet="showOnTimerSheet = true"
      />
    </div>

    <!-- 定时关机选择器 -->
    <TimePickerSheet
      :show="showOffTimerSheet"
      title="定时关机"
      :value="offTimerValue"
      @close="showOffTimerSheet = false"
      @confirm="(time: string) => withSending(() => handleOffTimerConfirm(time))"
      @clear="withSending(() => handleClearOffTimer())"
    />

    <!-- 定时开机选择器 -->
    <TimePickerSheet
      :show="showOnTimerSheet"
      title="定时开机"
      :value="onTimerValue"
      @close="showOnTimerSheet = false"
      @confirm="(time: string) => withSending(() => handleOnTimerConfirm(time))"
      @clear="withSending(() => handleClearOnTimer())"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import { toast } from 'vue-sonner'
import { useAcControl } from './composables/useAcControl'
import { useSensorData } from './composables/useSensorData'
import { useDeviceOnline } from './composables/useDeviceOnline'
import { timeToMinutes, minutesToTime } from './constants'
import AcDashboard from './components/AcDashboard.vue'
import AcControlGrid from './components/AcControlGrid.vue'
import TimePickerSheet from './components/TimePickerSheet.vue'
import SendingIndicator from './components/SendingIndicator.vue'

const SENDING_TIMEOUT = 30_000 // 30 秒超时

const ac = useAcControl()
const sensor = useSensorData()
const deviceOnline = useDeviceOnline()

const { isOffline, isOnline, statusLabel } = deviceOnline
const { temperature, humidity } = sensor

const showOffTimerSheet = ref(false)
const showOnTimerSheet = ref(false)
const sending = ref(false)
let sendingTimer: ReturnType<typeof setTimeout> | null = null

const offTimerValue = computed(() =>
  ac.state.value.offTimer > 0 ? minutesToTime(ac.state.value.offTimer) : '',
)

const onTimerValue = computed(() =>
  ac.state.value.onTimer > 0 ? minutesToTime(ac.state.value.onTimer) : '',
)

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

function handleOffTimerConfirm(time: string) {
  ac.setOffTimer(timeToMinutes(time))
  toast.success(`${time} 定时关机已设置`)
  showOffTimerSheet.value = false
}

function handleOnTimerConfirm(time: string) {
  ac.setOnTimer(timeToMinutes(time))
  toast.success(`${time} 定时开机已设置`)
  showOnTimerSheet.value = false
}

function handleClearOffTimer() {
  ac.cancelOffTimer()
  toast.success('定时关机已取消')
  showOffTimerSheet.value = false
}

function handleClearOnTimer() {
  ac.cancelOnTimer()
  toast.success('定时开机已取消')
  showOnTimerSheet.value = false
}
</script>
