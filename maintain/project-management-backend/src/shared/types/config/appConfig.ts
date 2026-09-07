/**
 * @file 应用配置类型（跨进程共享）
 */

/**
 * 应用配置数据
 */
export interface AppConfig {
  /** 本地 .secret 文件路径 */
  secretFilePath: string
  /** myHome OSS 根路径 */
  myHomeOssRootPath: string
  /** OSS 版本清单文件相对路径 */
  ossVersionManifestRelativePath: string
}
