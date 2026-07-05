/**
 * 设备在线状态
 */
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { bridge } from '@/modules/bridge'

export type DeviceStatus = 'online' | 'offline' | 'unknown'

export function useDeviceOnline() {
  const status = ref<DeviceStatus>('unknown')

  const isOnline = computed(() => status.value === 'online')
  const isOffline = computed(() => status.value === 'offline')

  function handleData(data: any) {
    status.value = (data?.isOnline !== undefined
      ? data.isOnline ? 'online' : 'offline'
      : 'unknown') as DeviceStatus
  }

  onMounted(() => {
    if (!bridge.isNativeEnv()) {
      return
    }
    bridge.on('deviceStatus', 'deviceStatus', handleData)
  })

  onUnmounted(() => {
    bridge.off('deviceStatus', 'deviceStatus')
  })

  /** 状态对应的中文标签 */
  const statusLabel = computed(() => {
    switch (status.value) {
      case 'online': return '在线'
      case 'offline': return '离线'
      default: return '未知'
    }
  })

  return { status, isOnline, isOffline, statusLabel }
}
