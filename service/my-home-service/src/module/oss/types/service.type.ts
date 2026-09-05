import OSS from 'ali-oss';

/**
 * oss临时访问凭证数据
 */
export type OssTempCredentials = OSS.Credentials & {
  ExpireSecond: number; // 过期时长（秒）
};

/**
 * 签名上传url配置选项
 */
export type SignUploadUrlOptions = {
  object: string; // object名称
  hash: string; // 文件hash
  mimeType: string; // 文件mimeType
  extraHeaders?: Record<string, string | number | boolean>; // 额外请求头
};

/**
 * 签名下载url配置选项
 */
export type SignDownloadUrlOptions = {
  object: string; // object名称
  filename: string; // 文件名称
  /**
   * 响应内容处置方式：
   *  - attachment：触发下载（默认，供文件下载使用）
   *  - inline：浏览器内联打开（供 <video>/<img> 等播放场景使用）
   */
  disposition?: 'attachment' | 'inline';
  expire?: number; // oss签名过期时间（秒），不传则使用默认配置
  httpCacheExpire?: number; // http缓存过期时间（秒）,默认：30 * 24 * 60 * 60
  extraQueries?: Record<string, string | number | boolean>; // 额外查询参数
};
