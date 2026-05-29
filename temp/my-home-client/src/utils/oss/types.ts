/**
 * 上传文件选项
 */
export interface UploadFileOptions {
  file: File; // 文件
  uploadDir: string; // 上传目录
}

/**
 * 获取签名url信息
 */
export interface CacheSignUrlInfo {
  url: string; // 签名url
  expirationTime: number; // 过期时间戳
}

/**
 * 获取oss链接签名地址选项
 */
export interface GetOssLinkSignUrlOptions {
  ossLink: string; // oss链接
  headers?: Record<string, string | number | boolean>; // 额外请求头参数
  queries?: Record<string, string | number | boolean>; // 额外查询参数
}

/**
 * 解析oss链接返回结果
 */
export interface ParseOssLinkResult {
  bucket: string; // bucket名称
  path: string; // 路径
}
