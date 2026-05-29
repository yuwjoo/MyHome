// ── 智能家居设备类型 ───────────────────────────────────────────────────────────

/** 设备类型枚举 */
export type DeviceType = 'light' | 'ac' | 'tv' | 'fan' | 'lock' | 'camera' | 'curtain' | 'speaker'

/** 智能设备 */
export interface SmartDevice {
  id: string
  name: string
  type: DeviceType
  room: string
  isOn: boolean
  value?: string
}
