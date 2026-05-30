import { ossUploadFile } from '@/api/modules/oss'
import { calcFileHash } from './hash'

export interface UploadOptions {
  /** 上传进度回调，0-100 */
  onProgress?: (percent: number) => void
}

/**
 * 上传文件到 OSS（秒传 + 直传）
 *
 * 流程：
 * 1. 计算文件 SHA-256
 * 2. POST /api/oss/uploadFile 获取签名（已上传则秒传跳过）
 * 3. PUT 直传 OSS（使用 XHR 支持进度回调）
 * 4. 返回 ossObjectRefId
 *
 * @param file 文件
 * @param options 可选配置（进度回调等）
 * @returns ossObjectRefId
 */
export const uploadToOss = async (file: File, options?: UploadOptions): Promise<string> => {
  const { onProgress } = options || {}

  const fileHash = await calcFileHash(file)

  const mimeType = file.type || 'application/octet-stream'

  const { data: resData } = await ossUploadFile({
    fileName: file.name,
    fileHash,
    fileSize: file.size,
    fileMime: mimeType,
  })

  const uploadRes = resData.data

  // 文件已存在 → 秒传
  if (uploadRes.isUploaded) {
    onProgress?.(100)
    return uploadRes.ossObjectRefId!
  }

  if (!uploadRes.signData?.signUrl) {
    throw new Error('无法获取 OSS 签名 URL')
  }

  // 文件不存在 → OSS 直传（使用 XHR 支持进度）
  const signHeaders = uploadRes.signData.signHeaders || {}
  const signUrl = uploadRes.signData.signUrl

  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText)
          onProgress?.(100)
          resolve(result.data as string)
        } catch {
          reject(new Error('OSS 响应解析失败'))
        }
      } else {
        reject(new Error(`OSS 上传失败，状态码 ${xhr.status}`))
      }
    })

    xhr.addEventListener('error', () => reject(new Error('OSS 网络请求失败')))
    xhr.upload.addEventListener('error', () => reject(new Error('OSS 上传中断')))

    xhr.open('PUT', signUrl)

    for (const [key, value] of Object.entries(signHeaders)) {
      xhr.setRequestHeader(key, value as string)
    }
    // 不手动设 Content-Type，让 XHR 自动处理边界
    xhr.setRequestHeader('Content-Type', mimeType)

    xhr.send(file)
  })
}
