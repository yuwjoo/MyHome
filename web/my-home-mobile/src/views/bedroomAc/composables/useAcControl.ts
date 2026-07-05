/**
 * 卧室空调控制
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { bridge } from '@/module/bridge'
import type { ActionMessageName } from '@/module/bridge/types/group/utils'
import { toast } from 'vue-sonner'

export interface ACState {
  power: boolean
  temperature: number
  mode: string
  swing: boolean
  windSpeed: string
  gentle: boolean
  light: boolean
  onTimer: number
  offTimer: number
}

const DEFAULT_STATE: ACState = {
  power: false,
  temperature: 26,
  mode: 'cool',
  swing: false,
  windSpeed: 'auto',
  gentle: false,
  light: true,
  onTimer: 0,
  offTimer: 0,
}

export function useAcControl() {
  const state = ref<ACState>({ ...DEFAULT_STATE })
  const loading = ref(true)

  function handleState(data: unknown) {
    console.log("空调状态data", data)
    state.value = { ...DEFAULT_STATE, ...(data as Partial<ACState>) }
    loading.value = false
  }

  onMounted(() => {
    if (!bridge.isNativeEnv()) {
      loading.value = false
      return
    }
    bridge.on('bedroomAC', 'acState', handleState)
  })

  onUnmounted(() => {
    bridge.off('bedroomAC', 'acState')
  })

  /** 发送控制指令 */
  function sendAction(action: ActionMessageName<'bedroomAC'>, extra?: Record<string, unknown>) {
    if (!bridge.isNativeEnv()) {
      toast.info(`[模拟] ${action}`)
      return
    }
    bridge.send('bedroomAC', action, extra)
  }

  return {
    state,
    loading,
    togglePower: () => sendAction('togglePower'),
    increaseTemperature: () => sendAction('increaseTemperature'),
    decreaseTemperature: () => sendAction('decreaseTemperature'),
    toggleSwing: () => sendAction('toggleSwing'),
    setCoolingMode: () => sendAction('setCoolingMode'),
    setHeatingMode: () => sendAction('setHeatingMode'),
    setDryMode: () => sendAction('setDryMode'),
    setFanMode: () => sendAction('setFanMode'),
    toggleWindSpeed: () => sendAction('toggleWindSpeed'),
    enableGentleMode: () => sendAction('enableGentleMode'),
    toggleLight: () => sendAction('toggleLight'),
    setOnTimer: (minutes: number) => sendAction('setOnTimer', { minutes }),
    setOffTimer: (minutes: number) => sendAction('setOffTimer', { minutes }),
    cancelOnTimer: () => sendAction('cancelOnTimer'),
    cancelOffTimer: () => sendAction('cancelOffTimer'),
  }
}
