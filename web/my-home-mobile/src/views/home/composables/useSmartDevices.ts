/**
 * src/views/home/composables/useSmartDevices.ts
 * 首页智能设备状态管理
 */
import { ref, computed } from 'vue'
import { toast } from 'vue-sonner'
import type { SmartDevice } from '@/types'
import { MOCK_DEVICES } from '@/constants'

export function useSmartDevices() {
  const devices = ref<SmartDevice[]>([...MOCK_DEVICES])

  /** 开启中的设备数量 */
  const onDevicesCount = computed(() => devices.value.filter((d) => d.isOn).length)

  /**
   * 切换单台设备开/关
   * @param id 设备 id
   */
  function toggleDevice(id: string) {
    devices.value = devices.value.map((d) => {
      if (d.id !== id) return d
      const next = { ...d, isOn: !d.isOn }
      toast.success(`${next.name} 已${next.isOn ? '开启' : '关闭'}`)
      return next
    })
  }

  return { devices, onDevicesCount, toggleDevice }
}
