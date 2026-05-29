/**
 * 文件下载工具
 *
 * - 通过云盘 API 获取签名下载 URL
 * - 使用隐藏 <a> 标签触发浏览器下载
 * - 支持单文件 + 批量下载
 */
import { cloudDiskGetFileDownloadUrl } from '@/api/modules/cloud-disk'
import { toast } from 'vue-sonner'

/**
 * 下载单个云盘文件
 * @param filePath 文件完整路径
 * @param fileName 文件名称（用作保存文件名）
 * @returns 是否成功
 */
export async function downloadCloudFile(filePath: string, fileName: string): Promise<boolean> {
  try {
    const res = await cloudDiskGetFileDownloadUrl({ filePath })

    const downloadUrl = res.data.data
    if (!downloadUrl) {
      toast.error(`获取下载链接失败：${fileName}`)
      return false
    }

    // 通过隐藏 <a> 标签触发浏览器下载
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = fileName
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()

    // 延迟移除，确保 click 已生效
    setTimeout(() => {
      document.body.removeChild(a)
    }, 100)

    return true
  } catch {
    toast.error(`下载失败：${fileName}`)
    return false
  }
}

/**
 * 批量下载云盘文件（逐个触发）
 * @param files 文件信息数组
 */
export async function downloadCloudFiles(files: { path: string; name: string }[]): Promise<{
  success: number
  failed: number
}> {
  let success = 0
  let failed = 0

  for (const file of files) {
    const ok = await downloadCloudFile(file.path, file.name)
    if (ok) success++
    else failed++
  }

  return { success, failed }
}
