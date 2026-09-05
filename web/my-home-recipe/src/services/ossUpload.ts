// ============================================================
// OSS 媒体上传（与服务端 oss/uploadFile + OSS 回调体系对接）
// ------------------------------------------------------------
// 流程（与 App 其他端保持一致）：
//   1) 计算文件 SHA-256（hash-wasm，http 内网环境同样可用）
//   2) POST /api/oss/uploadFile 登记：
//      - isUploaded=true  → 服务端已存在同 hash 文件，直接秒传
//      - 否则返回签名直传信息（signUrl + signHeaders）
//   3) PUT 直传 OSS，请求头必须与签名一致（Content-Type 与
//      x-oss-* 自定义头都会参与 V4 签名）
//   4) OSS 上传完成后回调服务端建引用，并把服务端响应正文
//      { code: 20200, data: refId } 作为 PUT 响应返回，
//      因此 PUT 成功后从响应体的 data 字段取 refId。
// ------------------------------------------------------------
// 说明：浏览器跨域直传依赖 OSS Bucket 的 CORS 配置已放行
// （PUT + Content-Type + x-oss-* 头）；生产环境建议与后端
// 同域反代或配置 Bucket CORS。
// ============================================================

import { createSHA256 } from 'hash-wasm'
import { ossApi } from './api'

/** 分块大小（2MB），兼顾内存与进度 */
const HASH_CHUNK = 2 * 1024 * 1024

/** 计算文件 SHA-256（hex） */
async function computeFileHash(file: Blob): Promise<string> {
  const hasher = await createSHA256()
  for (let offset = 0; offset < file.size; offset += HASH_CHUNK) {
    const chunk = file.slice(offset, offset + HASH_CHUNK)
    hasher.update(new Uint8Array(await chunk.arrayBuffer()))
  }
  return hasher.digest('hex')
}

export interface UploadTarget {
  /** 原始文件名（用于后端对象 key 与回显） */
  name: string
  /** MIME 类型（参与签名，必须与服务端一致） */
  mimeType: string
}

/**
 * 上传一个媒体文件到 OSS 并返回 oss 引用 id（refId）
 * @param file 文件内容
 * @param target 文件名 / MIME 元信息
 * @returns refId（后续作为菜谱媒体的云端引用）
 */
export async function uploadMediaToOss(file: Blob, target: UploadTarget): Promise<string> {
  // 1) 计算 hash 并登记
  const fileHash = await computeFileHash(file)
  const upload = await ossApi.uploadFile({
    fileName: target.name,
    fileHash,
    fileSize: file.size,
    fileMime: target.mimeType,
  })

  // 2) 已存在同 hash 文件：秒传
  if (upload.isUploaded) {
    if (!upload.ossObjectRefId) throw new Error('文件已存在但缺少引用，请重试')
    return upload.ossObjectRefId
  }

  // 3) 签名直传
  const signUrl = upload.signData?.signUrl
  if (!signUrl) throw new Error('未获取到上传签名，请重试')

  const headers: Record<string, string> = { 'Content-Type': target.mimeType }
  for (const [key, value] of Object.entries(upload.signData?.signHeaders ?? {})) {
    headers[key] = String(value)
  }

  let res: Response
  try {
    res = await fetch(signUrl, { method: 'PUT', headers, body: file })
  } catch {
    throw new Error('上传失败：OSS 可能未放行跨域直传（CORS），或网络异常')
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`上传失败（HTTP ${res.status}${detail ? `：${detail.slice(0, 120)}` : ''}）`)
  }

  // 4) 解析回调回执中的 refId
  const body: { data?: unknown } | null = await res.json().catch(() => null)
  const refId = body?.data
  if (typeof refId !== 'string' || !refId) {
    throw new Error('上传失败：未收到云端引用')
  }
  return refId
}
