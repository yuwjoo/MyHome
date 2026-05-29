/**
 * 缩略图加载工具
 *
 * - 使用 axios（带 Authorization）以 Blob 形式拉取缩略图
 * - 创建 Object URL 供 <img> 标签使用
 * - 内置缓存，避免同一文件重复请求
 */
import { cloudDiskGetFileThumbnailBlob } from '@/api/modules/cloud-disk'

const cache = new Map<string, string>()

/**
 * 加载云盘文件缩略图，返回 Object URL
 * @param filePath 文件完整路径
 * @param width    缩略图宽度（默认 200）
 */
export async function loadThumbnail(filePath: string, width = 200): Promise<string | null> {
  const key = `${width}_${filePath}`
  const cached = cache.get(key)
  if (cached) return cached

  try {
    const res = await cloudDiskGetFileThumbnailBlob({ filePath, imageWidth: width })
    const url = URL.createObjectURL(res.data as Blob)
    cache.set(key, url)
    return url
  } catch {
    return null
  }
}

/**
 * 清理指定缩略图缓存 & revoke Object URL
 */
export function revokeThumbnail(filePath: string, width = 200): void {
  const key = `${width}_${filePath}`
  const url = cache.get(key)
  if (url) {
    URL.revokeObjectURL(url)
    cache.delete(key)
  }
}

/**
 * 释放所有缓存的 Object URL（页面卸载时调用）
 */
export function clearThumbnailCache(): void {
  for (const url of cache.values()) URL.revokeObjectURL(url)
  cache.clear()
}
