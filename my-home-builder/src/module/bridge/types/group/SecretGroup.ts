/**
 * 加密凭证推送/拉取分组消息
 */
export type SecretGroup = {
  /**
   * 推送 .secret 目录到 OSS（压缩加密上传）
   */
  pushSecret: {
    type: 'action'
    params: Record<string, never>
    callbacks: {
      onProgress: (data: { step: string }) => void
      onSuccess: (data: { url: string }) => void
      onError: (data: { message: string }) => void
    }
  }

  /**
   * 从 OSS 拉取并还原 .secret 目录（下载解密）
   */
  pullSecret: {
    type: 'action'
    params: { targetDir?: string }
    callbacks: {
      onProgress: (data: { step: string }) => void
      onSuccess: (data: { targetDir: string }) => void
      onError: (data: { message: string }) => void
    }
  }
}
