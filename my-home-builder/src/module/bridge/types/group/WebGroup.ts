/**
 * Web 项目发布分组消息
 */
export type WebGroup = {
  /**
   * 发布 my-home-mobile 项目（版本更新 → 构建 → 压缩 → 上传 OSS）
   */
  publishMyHomeMobile: {
    type: 'action'
    params: { version: string }
    callbacks: {
      onProgress: (data: { step: string; version?: string }) => void
      onBuildOutput: (data: { data: string }) => void
      onSuccess: (data: { url: string; version: string }) => void
      onError: (data: { message: string }) => void
    }
  }
}
