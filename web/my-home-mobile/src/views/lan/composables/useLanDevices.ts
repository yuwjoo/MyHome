/**
 * 内网设备数据
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { bridge } from '@/module/bridge'
import type { LanDevicePayload } from '@/module/bridge/types/group/lanUdpGroup'

export function useLanDevices() {
  const devices = ref<LanDevicePayload[]>([])
  const connected = ref(false)

  onMounted(() => {
    if (!bridge.isNativeEnv()) return

    // 监听设备变更（bridge.on 内部自动发送 action:'on' 到原生端）
    bridge.on('lanUdp', 'devices', (data: any) => {
      devices.value = (data?.devices ?? []) as LanDevicePayload[]
    })

    // 监听连接状态变更
    bridge.on('lanUdp', 'connection', (data: any) => {
      connected.value = !!data?.connected
    })

    // 主动获取当前设备列表
    bridge.send('lanUdp', 'getDeviceList', {}, {
      onResult: (data: any) => {
        devices.value = (data?.devices ?? []) as LanDevicePayload[]
      },
    })
  })

  onUnmounted(() => {
    // bridge.off 内部自动发送 action:'off' 到原生端
    bridge.off('lanUdp', 'devices')
    bridge.off('lanUdp', 'connection')
  })

  /**
   * 手动刷新设备列表
   */
  function refresh(): Promise<void> {
    return new Promise((resolve) => {
      if (!bridge.isNativeEnv()) {
        resolve()
        return
      }
      bridge.send('lanUdp', 'getDeviceList', {}, {
        onResult: (data: any) => {
          devices.value = (data?.devices ?? []) as LanDevicePayload[]
          resolve()
        },
      })
    })
  }

  return { devices, connected, refresh }
}
