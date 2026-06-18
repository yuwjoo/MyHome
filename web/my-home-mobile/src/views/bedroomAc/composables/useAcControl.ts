/**
 * 卧室空调控制 — 状态查询 + 控制指令 + 实时订阅
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { getNativeBridge, isNativeEnv } from '@/modules/nativeBridge'
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
  const bridge = getNativeBridge()
  const state = ref<ACState>({ ...DEFAULT_STATE })
  const loading = ref(true)
  let unsub: (() => void) | null = null

  onMounted(() => {
    if (!isNativeEnv()) {
      loading.value = false
      return
    }

    // 订阅实时状态推送
    bridge.send('bedroomAC', { action: 'subscribeState' })

    unsub = bridge.on('onACStateChanged', (data) => {
      state.value = { ...DEFAULT_STATE, ...(data as Partial<ACState>) }
      loading.value = false
    })

    // 获取当前状态
    bridge.send('bedroomAC', { action: 'getState' }, {
      onState: (data) => {
        state.value = { ...DEFAULT_STATE, ...(data as Partial<ACState>) }
        loading.value = false
      },
    })
  })

  onUnmounted(() => {
    unsub?.()
    if (isNativeEnv()) {
      bridge.send('bedroomAC', { action: 'unsubscribeState' })
    }
  })

  /** 发送控制指令（单向，无回调） */
  function sendAction(action: string, extra?: Record<string, unknown>) {
    if (!isNativeEnv()) {
      toast.info(`[模拟] ${action}`)
      return
    }
    bridge.send('bedroomAC', { action, ...extra })
  }

  return {
    state,
    loading,
    togglePower: () => sendAction('togglePower'),
    increaseTemperature: () => sendAction('increaseTemperature'),
    decreaseTemperature: () => sendAction('decreaseTemperature'),
    setOnTimer: (minutes: number) => sendAction('setOnTimer', { minutes }),
    setOffTimer: (minutes: number) => sendAction('setOffTimer', { minutes }),
    cancelOnTimer: () => sendAction('cancelOnTimer'),
    cancelOffTimer: () => sendAction('cancelOffTimer'),
  }
}
