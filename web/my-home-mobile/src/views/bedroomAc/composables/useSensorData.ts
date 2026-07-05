/**
 * 温湿度传感器数据
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { bridge } from '@/module/bridge'

export function useSensorData() {
  const temperature = ref<number | null>(null)
  const humidity = ref<number | null>(null)
  const loading = ref(true)

  function handleData(data: any) {
    temperature.value = data?.temperature ?? null
    humidity.value = data?.humidity ?? null
    loading.value = false
  }

  onMounted(() => {
    if (!bridge.isNativeEnv()) {
      loading.value = false
      return
    }
    bridge.on('sensor', 'tempHumid', handleData)
  })

  onUnmounted(() => {
    bridge.off('sensor', 'tempHumid')
  })

  return { temperature, humidity, loading }
}
