/**
 * 设备在线状态 — MQTT 遗嘱机制实时推送
 */
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { getNativeBridge, isNativeEnv } from '@/modules/nativeBridge'

export type DeviceStatus = 'online' | 'offline' | 'unknown'

export function useDeviceOnline() {
  const bridge = getNativeBridge()
  const status = ref<DeviceStatus>('unknown')
  let unsub: (() => void) | null = null

  const isOnline = computed(() => status.value === 'online')
  const isOffline = computed(() => status.value === 'offline')

  onMounted(() => {
    if (!isNativeEnv()) {
      return
    }

    bridge.send('deviceStatus', { action: 'subscribeStatus' })

    unsub = bridge.on('onDeviceStatusChanged', (data: any) => {
      status.value = (data?.status as DeviceStatus) || 'unknown'
    })

    bridge.send('deviceStatus', { action: 'getStatus' }, {
      onStatus: (data: any) => {
        status.value = (data?.status as DeviceStatus) || 'unknown'
      },
    })
  })

  onUnmounted(() => {
    unsub?.()
    if (isNativeEnv()) {
      bridge.send('deviceStatus', { action: 'unsubscribeStatus' })
    }
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
