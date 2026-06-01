/**
 * 更新阶段状态枚举
 */

export enum UpdateStatus {
  CHECKING    = 'checking',     // 正在检查版本
  UP_TO_DATE  = 'upToDate',     // 已是最新版本
  DOWNLOADING = 'downloading',  // 正在下载更新包
  EXTRACTING  = 'extracting',   // 正在解压资源
  CLEANING    = 'cleaning',     // 正在清理临时文件
  COMPLETE    = 'complete',     // 更新完成
  ERROR       = 'error',        // 发生错误
}
