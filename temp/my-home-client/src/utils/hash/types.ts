/**
 * 计算文件hash配置项
 */
export interface CalcFileHashOptions {
  chunkSize?: number; // 分块大小，默认2MB
  onProgress?: (progress: number) => void; // 进度回调 0~1
}
