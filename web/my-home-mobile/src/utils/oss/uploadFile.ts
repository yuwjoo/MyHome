import { ossUploadFile } from '@/api/modules/oss'
import { calcFileHash } from './hash'

/**
 * 上传文件到 OSS（秒传 + 直传）
 *
 * 流程：
 * 1. 计算文件 SHA-256
 * 2. POST /api/oss/uploadFile 获取签名（已上传则秒传跳过）
 * 3. PUT 直传 OSS
 * 4. 返回 ossObjectRefId
 *
 * @param file 文件
 * @returns ossObjectRefId
 */
export const uploadToOss = async (file: File): Promise<string> => {
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
    return uploadRes.ossObjectRefId!
  }

  if (!uploadRes.signData?.signUrl) {
    throw new Error('无法获取 OSS 签名 URL')
  }

  // 文件不存在 → OSS 直传
  const signHeaders = uploadRes.signData.signHeaders || {}
  const response = await fetch(uploadRes.signData.signUrl, {
    method: 'PUT',
    headers: {
      ...signHeaders,
      'Content-Type': mimeType,
    },
    body: file,
  })

  if (!response.ok) {
    throw new Error(`OSS 上传失败，状态码 ${response.status}`)
  }

  const result = await response.json()
  return result.data as string
}
