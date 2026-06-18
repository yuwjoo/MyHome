/**
 * 温湿度传感器数据 — 实时获取房间温湿度
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { getNativeBridge, isNativeEnv } from '@/modules/nativeBridge'

export function useSensorData() {
  const bridge = getNativeBridge()
  const temperature = ref<number | null>(null) // 室温 °C
  const humidity = ref<number | null>(null) // 湿度 %
  const loading = ref(true)
  let unsub: (() => void) | null = null

  onMounted(() => {
    if (!isNativeEnv()) {
      loading.value = false
      return
    }

    bridge.send('tempHumid', { action: 'subscribeState' })

    unsub = bridge.on('onTempHumidChanged', (data: any) => {
      temperature.value = data?.temperature ?? null
      humidity.value = data?.humidity ?? null
      loading.value = false
    })

    bridge.send('tempHumid', { action: 'getState' }, {
      onState: (data: any) => {
        temperature.value = data?.temperature ?? null
        humidity.value = data?.humidity ?? null
        loading.value = false
      },
    })
  })

  onUnmounted(() => {
    unsub?.()
    if (isNativeEnv()) {
      bridge.send('tempHumid', { action: 'unsubscribeState' })
    }
  })

  return { temperature, humidity, loading }
}
