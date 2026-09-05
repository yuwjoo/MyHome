/**
 * Android 项目发布分组消息
 */
type PublishAndroidMessage = {
  type: 'action'
  params: { version: string }
  callbacks: {
    onProgress: (data: { step: string; version?: string; versionCode?: number }) => void
    onBuildOutput: (data: { data: string }) => void
    onSuccess: (data: { url: string; version: string; versionCode: number }) => void
    onError: (data: { message: string }) => void
  }
}

export type AndroidGroup = {
  /**
   * 发布 MyHome Android 项目（更新 gradle 版本 → 构建 APK → 上传 OSS）
   */
  publishMyHome: PublishAndroidMessage
  /**
   * 发布 MyHomeRecipe（菜谱）Android 项目（更新 gradle 版本 → 构建 APK → 上传 OSS）
   */
  publishMyHomeRecipe: PublishAndroidMessage
}
