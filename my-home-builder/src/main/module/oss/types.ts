/**
 * OSS 配置
 */
export interface OssConfig {
  /** 地域，如 oss-cn-hangzhou */
  region: string;
  accessKeyId: string;
  accessKeySecret: string;
  bucket: string;
}
