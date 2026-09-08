/**
 * @file 凭据类型：credentials.yaml 结构定义
 */

/**
 * OSS 配置
 */
export interface OssConfig {
  /** 地域，如 oss-cn-hangzhou */
  region: string
  /** AccessKey ID（访问密钥标识） */
  accessKeyId: string
  /** AccessKey Secret（访问密钥） */
  accessKeySecret: string
  /** 存储空间（Bucket）名称 */
  bucket: string
}

/** credentials.yaml 结构：目前仅包含 OSS 凭据 */
export interface Credentials {
  /** OSS 凭据 */
  oss: OssConfig
}
