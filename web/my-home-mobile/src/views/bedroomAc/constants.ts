/**
 * 模式中文映射
 */
export const MODE_MAP: Record<string, string> = {
  cool: '制冷',
  heat: '制热',
  dry: '除湿',
  fan: '送风',
}

/**
 * 风速中文映射
 */
export const WIND_SPEED_MAP: Record<string, string> = {
  auto: '自动',
  low: '低速',
  medium: '中速',
  high: '高速',
}

/**
 * 定时预设选项（0.5h ~ 12h，步长 30min）
 */
export const TIMER_OPTIONS = Array.from({ length: 24 }, (_, i) => (i + 1) * 30)

/**
 * 将分钟数格式化为可读字符串
 */
export function formatMinutes(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h${m > 0 ? `${m}m` : ''}` : `${m}m`
}
