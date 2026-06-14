import { ossUploadFile } from '@/api/modules/oss'
import { calcFileHash } from '@/utils/oss/hash'
import type { UploadOptions } from '@/utils/oss/uploadFile'

/**
 * 可中断的 OSS 上传
 * 与 uploadToOss 逻辑相同，但返回 { promise, xhr } 以支持 abort
 */
export function uploadToOssAbortable(
  file: File,
  options?: UploadOptions
): { promise: Promise<string>; xhr: XMLHttpRequest | null } {
  const { onProgress } = options || {}

  const result = {
    promise: (async (): Promise<string> => {
      const fileHash = await calcFileHash(file)
      const mimeType = file.type || 'application/octet-stream'

      const { data: resData } = await ossUploadFile({
        fileName: file.name,
        fileHash,
        fileSize: file.size,
        fileMime: mimeType,
      })

      const uploadRes = resData.data

      if (uploadRes.isUploaded) {
        onProgress?.(100)
        return uploadRes.ossObjectRefId!
      }

      if (!uploadRes.signData?.signUrl) {
        throw new Error('无法获取 OSS 签名 URL')
      }

      const signHeaders = uploadRes.signData.signHeaders || {}
      const signUrl = uploadRes.signData.signUrl

      return new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        result.xhr = xhr

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable && onProgress) {
            onProgress(Math.round((e.loaded / e.total) * 100))
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const parseResult = JSON.parse(xhr.responseText)
              onProgress?.(100)
              resolve(parseResult.data as string)
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
        xhr.setRequestHeader('Content-Type', mimeType)

        xhr.send(file)
      })
    })(),
    xhr: null as XMLHttpRequest | null,
  }

  return result
}
