import { createSHA256 } from 'hash-wasm'

const CHUNK_SIZE = 2 * 1024 * 1024 // 2MB 分块

/**
 * 计算文件 SHA-256 哈希值（分块读取，避免大文件撑爆内存）
 *
 * @param file 文件
 * @returns 十六进制哈希字符串
 */
export const calcFileHash = async (file: File): Promise<string> => {
  const hasher = await createSHA256()
  const totalSize = file.size
  let offset = 0

  while (offset < totalSize) {
    const end = Math.min(offset + CHUNK_SIZE, totalSize)
    const chunk = file.slice(offset, end)
    const buffer = await chunk.arrayBuffer()
    hasher.update(new Uint8Array(buffer))
    offset = end
  }

  return hasher.digest('hex')
}
