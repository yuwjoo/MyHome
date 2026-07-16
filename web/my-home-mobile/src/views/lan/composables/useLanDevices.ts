/**
 * 内网设备数据
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { bridge } from '@/module/bridge'
import type { LanDevicePayload } from '@/module/bridge/types/group/lanUdpGroup'

export function useLanDevices() {
  const devices = ref<LanDevicePayload[]>([])
  const connected = ref(false)
  const loading = ref(true)

  /**
   * 处理设备列表数据
   */
  function handleDeviceList(data: any) {
    devices.value = (data?.devices ?? []) as LanDevicePayload[]
    loading.value = false
  }

  /**
   * 处理设备变更事件
   */
  function handleDevices(data: any) {
    devices.value = (data?.devices ?? []) as LanDevicePayload[]
  }

  /**
   * 处理连接状态变更
   */
  function handleConnection(data: any) {
    connected.value = !!data?.connected
  }

  /**
   * 手动刷新设备列表
   */
  function refresh(): Promise<void> {
    loading.value = true
    return new Promise((resolve) => {
      if (!bridge.isNativeEnv()) {
        loading.value = false
        resolve()
        return
      }
      bridge.send('lanUdp', 'getDeviceList', {}, {
        onResult: (data) => {
          handleDeviceList(data)
          resolve()
        },
      })
      // 超时兜底
      setTimeout(() => {
        if (loading.value) {
          loading.value = false
          resolve()
        }
      }, 10_000)
    })
  }

  onMounted(() => {
    if (!bridge.isNativeEnv()) {
      loading.value = false
      return
    }
    bridge.on('lanUdp', 'devices', handleDevices)
    bridge.on('lanUdp', 'connection', handleConnection)
    refresh()
  })

  onUnmounted(() => {
    bridge.off('lanUdp', 'devices')
    bridge.off('lanUdp', 'connection')
  })

  return { devices, connected, loading, refresh }
}
