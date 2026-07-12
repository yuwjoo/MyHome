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
 * 全天时间槽（每 30 分钟一个，00:00 ~ 23:30，共 48 个）
 */
export const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2)
  const m = i % 2 === 0 ? '00' : '30'
  return `${String(h).padStart(2, '0')}:${m}`
})

/**
 * 当天的分钟数 → HH:MM
 */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/**
 * HH:MM → 当天的分钟数
 */
export function timeToMinutes(time: string): number {
  const [h = 0, m = 0] = time.split(':').map(Number)
  return h * 60 + m
}

/**
 * 将分钟数格式化为可读字符串（相对时长：1h30m）
 */
export function formatMinutes(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}h${m > 0 ? `${m}m` : ''}` : `${m}m`
}
