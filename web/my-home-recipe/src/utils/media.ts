// ============================================================
// 媒体处理工具
// ------------------------------------------------------------
// 负责：识别图片/视频、提取宽高/时长，并生成一张压缩缩略图
// （canvas 绘制 dataURL），供列表与编辑网格快速展示。
// 所有函数均为“尽力而为”：单文件处理失败只返回 null，
// 由调用方提示用户，不影响整体流程。
// ============================================================

import type { MediaKind } from '@/types/recipe'

export interface ProcessedMedia {
  /** 识别出的媒体类型 */
  kind: MediaKind
  /** 原始文件 */
  blob: Blob
  name: string
  mimeType: string
  size: number
  width?: number
  height?: number
  /** 视频时长（秒，仅视频有） */
  duration?: number
  /** 缩略图 dataURL */
  thumbnail?: string
}

/** 缩略图最长边（px）——太大 dataURL 冗长，太小列表会糊 */
const THUMB_MAX_SIDE = 520

/** 支持解码的扩展名（MIME 缺失/异常时兜底） */
const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'heic', 'heif', 'avif']
const VIDEO_EXTS = ['mp4', 'mov', 'webm', 'm4v', '3gp', 'mkv']

/** 由文件类型判断是图片还是视频；无法识别返回 null */
export function guessKind(file: File): MediaKind | null {
  const type = file.type.toLowerCase()
  if (type.startsWith('image/')) return 'image'
  if (type.startsWith('video/')) return 'video'

  const ext = file.name.toLowerCase().split('.').pop() ?? ''
  if (IMAGE_EXTS.includes(ext)) return 'image'
  if (VIDEO_EXTS.includes(ext)) return 'video'
  return null
}

/** 等待某个事件一次（带超时保护，避免个别文件长时间挂起） */
function once(target: EventTarget, event: string, timeoutMs = 10_000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(`等待 ${event} 超时`)), timeoutMs)
    const done = (error?: unknown) => {
      window.clearTimeout(timer)
      if (error) reject(error)
      else resolve()
    }
    target.addEventListener(event, () => done(), { once: true })
    target.addEventListener('error', () => done(new Error('媒体加载失败')), { once: true })
  })
}

/** 等比缩放到最长边 maxSide，返回绘制尺寸 */
function scaleToFit(width: number, height: number, maxSide: number): { w: number; h: number } {
  const ratio = Math.min(1, maxSide / Math.max(width, height || 1))
  return { w: Math.max(1, Math.round(width * ratio)), h: Math.max(1, Math.round(height * ratio)) }
}

/** 绘制 canvas 并导出 dataURL */
function drawCanvas(source: CanvasImageSource, width: number, height: number): string {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('无法创建画布')
  // 先铺白底（JPEG 无透明通道；PNG 透明图转 JPEG 避免黑底）
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(source, 0, 0, width, height)
  return canvas.toDataURL('image/jpeg', 0.82)
}

/** 为图片生成缩略图 + 读取原始宽高 */
export async function generateImageThumb(file: Blob): Promise<{
  thumbnail: string
  width: number
  height: number
} | null> {
  const url = URL.createObjectURL(file)
  try {
    const img = await onceLoadedImage(url)
    const { w, h } = scaleToFit(img.naturalWidth, img.naturalHeight, THUMB_MAX_SIDE)
    return { thumbnail: drawCanvas(img, w, h), width: img.naturalWidth, height: img.naturalHeight }
  } catch {
    return null
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** 加载 <img>（封装 onload/onerror） */
function onceLoadedImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片解码失败'))
    img.src = src
  })
}

/**
 * 为视频生成封面缩略图 + 读取时长/宽高
 * 取「中间偏前的一帧」绘制，画面更有代表性。
 */
export async function generateVideoThumb(file: Blob): Promise<{
  thumbnail: string
  width: number
  height: number
  duration: number
} | null> {
  const url = URL.createObjectURL(file)
  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.preload = 'auto'
  // 部分 WebView/移动浏览器要求视频元素在文档内才开始真正解码加载，
  // 放到屏幕外隐藏节点以兼容这类环境。
  video.style.cssText =
    'position:fixed;left:-10000px;top:-10000px;width:2px;height:2px;opacity:0;pointer-events:none;'
  video.src = url
  document.body.appendChild(video)

  try {
    await once(video, 'loadedmetadata')
    // 确保至少已有可绘制的当前帧
    if (video.readyState < 2) await once(video, 'loadeddata')
    const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0
    const width = video.videoWidth
    const height = video.videoHeight

    if (!width || !height) return null

    // 跳到「中间偏前」的一帧再截取，画面更有代表性。
    // 个别编码 seek 支持差，失败后回退首帧附近，尽量保证有封面。
    const target = duration > 1 ? Math.min(0.6, duration * 0.4) : 0.01
    try {
      video.currentTime = target
      await once(video, 'seeked')
    } catch {
      try {
        video.currentTime = 0.01
        await once(video, 'seeked')
      } catch {
        // 保持当前（首帧）画面
      }
    }
    if (video.readyState < 2) await once(video, 'loadeddata')

    const { w, h } = scaleToFit(width, height, THUMB_MAX_SIDE)
    return { thumbnail: drawCanvas(video, w, h), width, height, duration }
  } catch {
    return null
  } finally {
    if (video.parentNode) video.parentNode.removeChild(video)
    URL.revokeObjectURL(url)
    // 释放视频资源
    video.removeAttribute('src')
    video.load()
  }
}

/**
 * 处理用户选择的一个文件：识别类型 → 提取元信息 + 生成缩略图
 * @returns 失败（不支持/解码失败）时返回 null
 */
export async function processMediaFile(file: File): Promise<ProcessedMedia | null> {
  const kind = guessKind(file)
  if (!kind) return null

  const base = {
    kind,
    blob: file as Blob,
    name: file.name,
    mimeType: file.type || (kind === 'image' ? 'image/jpeg' : 'video/mp4'),
    size: file.size,
  }

  try {
    if (kind === 'image') {
      const image = await generateImageThumb(file)
      if (!image) return base
      return { ...base, ...image }
    }
    const video = await generateVideoThumb(file)
    if (!video) return base
    return { ...base, ...video }
  } catch {
    // 缩略图失败时仍保留原文件（主流程不中断）
    return base
  }
}
