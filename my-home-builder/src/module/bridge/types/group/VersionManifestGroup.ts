/**
 * 版本清单分组消息
 */
export type VersionManifestGroup = {
  /**
   * 获取版本清单数据
   */
  getManifest: {
    type: 'action'
    params: Record<string, never>
    callbacks: {
      onSuccess: (data: { manifest: object }) => void
      onError: (data: { message: string }) => void
    }
  }

  /**
   * 发布版本清单（覆盖本地文件 + 上传 OSS）
   */
  publishManifest: {
    type: 'action'
    params: { manifest: object }
    callbacks: {
      onSuccess: (data: { url: string }) => void
      onError: (data: { message: string }) => void
    }
  }
}
