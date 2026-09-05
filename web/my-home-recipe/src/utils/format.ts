// ============================================================
// 通用格式化工具：id、时间、文件大小等
// ============================================================

/** 生成唯一 id（优先 crypto.randomUUID） */
export function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

const pad = (n: number): string => String(n).padStart(2, '0')

/**
 * 将时间戳格式化为“友好”文案：
 * 刚刚 / N 分钟前 / 今天 09:30 / 昨天 / 09月05日 / 2026年09月05日
 */
export function formatFriendlyTime(ts: number): string {
  const date = new Date(ts)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  // 1 分钟以内
  if (diff < 60_000) return '刚刚'
  // 60 分钟以内
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const startOfThatDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime()
  const dayDiff = Math.round((startOfToday - startOfThatDay) / 86_400_000)

  if (dayDiff === 0) return `今天 ${pad(date.getHours())}:${pad(date.getMinutes())}`
  if (dayDiff === 1) return '昨天'

  const sameYear = date.getFullYear() === now.getFullYear()
  const md = `${date.getMonth() + 1}月${date.getDate()}日`
  return sameYear ? md : `${date.getFullYear()}年${md}`
}

/** 完整时间：2026/09/05 09:30 */
export function formatDateTime(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 字节数 -> 可读文案 */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** 视频时长（秒）-> 01:23 文案 */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds || 0))
  const m = Math.floor(s / 60)
  const rest = s % 60
  return `${pad(m)}:${pad(rest)}`
}
