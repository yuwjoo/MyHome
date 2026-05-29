/**
 * src/views/devices/composables/useDeviceList.ts
 * 设备列表状态管理（含搜索、房间筛选、全部开关）
 */
import { ref, computed } from 'vue'
import { toast } from 'vue-sonner'
import type { SmartDevice } from '@/types'
import { MOCK_DEVICES, DEVICE_LABELS } from '@/constants'

const ALL_TAB = '全部'

export function useDeviceList() {
  const devices    = ref<SmartDevice[]>([...MOCK_DEVICES])
  const activeRoom = ref<string>(ALL_TAB)
  const search     = ref('')

  /** 所有房间列表（含"全部"） */
  const rooms = computed(() => [ALL_TAB, ...Array.from(new Set(devices.value.map((d) => d.room)))])

  /** 运行中设备数量 */
  const onCount = computed(() => devices.value.filter((d) => d.isOn).length)

  /** 是否全部开启 */
  const allOn = computed(() => devices.value.every((d) => d.isOn))

  /** 经房间 + 搜索过滤后的设备列表 */
  const filtered = computed(() =>
    devices.value.filter((d) => {
      const matchRoom = activeRoom.value === ALL_TAB || d.room === activeRoom.value
      const matchSearch =
        search.value === '' ||
        d.name.includes(search.value) ||
        d.room.includes(search.value) ||
        DEVICE_LABELS[d.type]?.includes(search.value)
      return matchRoom && matchSearch
    }),
  )

  /** 切换单台设备 */
  function toggleDevice(id: string) {
    devices.value = devices.value.map((d) => {
      if (d.id !== id) return d
      const next = { ...d, isOn: !d.isOn }
      toast.success(`${next.name} 已${next.isOn ? '开启' : '关闭'}`)
      return next
    })
  }

  /** 切换所有设备 */
  function toggleAll() {
    const nextOn = !allOn.value
    devices.value = devices.value.map((d) => ({ ...d, isOn: nextOn }))
    toast.success(nextOn ? '已开启所有设备' : '已关闭所有设备')
  }

  return { devices, activeRoom, search, rooms, onCount, allOn, filtered, toggleDevice, toggleAll }
}
