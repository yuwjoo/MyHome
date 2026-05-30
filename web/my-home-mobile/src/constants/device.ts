/**
 * src/constants/device.ts
 * 智能设备相关静态常量（图标映射、颜色主题、标签文字）
 * 供 HomePage、DevicesPage 共用，避免重复定义
 */
import {
  SunIcon,
  ThermometerIcon,
  TvIcon,
  WindIcon,
  LockIcon,
  CameraIcon,
  MusicIcon,
} from 'lucide-vue-next'
import type { DeviceType } from '@/types'

/** 设备类型 → 图标组件 */
export const DEVICE_ICON_MAP: Record<DeviceType, (typeof SunIcon)> = {
  light: SunIcon,
  ac: ThermometerIcon,
  tv: TvIcon,
  fan: WindIcon,
  lock: LockIcon,
  camera: CameraIcon,
  curtain: WindIcon,
  speaker: MusicIcon,
}

/** 设备类型 → 开/关状态颜色类名 */
export const DEVICE_COLORS: Record<DeviceType, { on: string; off: string }> = {
  light:   { on: 'bg-amber-100 text-amber-600',   off: 'bg-muted text-muted-foreground' },
  ac:      { on: 'bg-cyan-100 text-cyan-600',      off: 'bg-muted text-muted-foreground' },
  tv:      { on: 'bg-blue-100 text-blue-600',      off: 'bg-muted text-muted-foreground' },
  fan:     { on: 'bg-emerald-100 text-emerald-600', off: 'bg-muted text-muted-foreground' },
  lock:    { on: 'bg-green-100 text-green-600',    off: 'bg-muted text-muted-foreground' },
  camera:  { on: 'bg-rose-100 text-rose-500',      off: 'bg-muted text-muted-foreground' },
  curtain: { on: 'bg-indigo-100 text-indigo-500',  off: 'bg-muted text-muted-foreground' },
  speaker: { on: 'bg-purple-100 text-purple-600',  off: 'bg-muted text-muted-foreground' },
}

/** 设备类型 → 中文标签 */
export const DEVICE_LABELS: Record<DeviceType, string> = {
  light:   '灯光',
  ac:      '空调',
  tv:      '电视',
  fan:     '风扇',
  lock:    '门锁',
  camera:  '摄像头',
  curtain: '窗帘',
  speaker: '音箱',
}

/** 初始示例设备数据（开发/演示用） */
export const MOCK_DEVICES = [
  { id: 'd1', name: '客厅灯',    type: 'light'   as DeviceType, room: '客厅', isOn: true,  value: '75%'  },
  { id: 'd2', name: '主卧空调',  type: 'ac'      as DeviceType, room: '主卧', isOn: true,  value: '26°C' },
  { id: 'd3', name: '客厅电视',  type: 'tv'      as DeviceType, room: '客厅', isOn: false, value: '已关闭' },
  { id: 'd4', name: '入户门锁',  type: 'lock'    as DeviceType, room: '玄关', isOn: true,  value: '已锁定' },
  { id: 'd5', name: '走廊摄像头', type: 'camera' as DeviceType, room: '走廊', isOn: true,  value: '录制中' },
  { id: 'd6', name: '卧室窗帘',  type: 'curtain' as DeviceType, room: '主卧', isOn: false, value: '已收起' },
  { id: 'd7', name: '客厅风扇',  type: 'fan'     as DeviceType, room: '客厅', isOn: true,  value: '3档'  },
  { id: 'd8', name: '智能音箱',  type: 'speaker' as DeviceType, room: '书房', isOn: true,  value: '播放中' },
]
