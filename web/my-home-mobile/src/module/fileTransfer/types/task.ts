/**
 * 传输任务状态枚举
 */
export enum TransferTaskStatus {
  /** 等待调度 */
  WAITING = 'WAITING',
  /** 传输中 */
  TRANSFERRING = 'TRANSFERRING',
  /** 已暂停 */
  PAUSED = 'PAUSED',
  /** 传输成功 */
  SUCCESS = 'SUCCESS',
  /** 传输失败 */
  FAILED = 'FAILED',
  /** 已取消 */
  CANCELED = 'CANCELED',
  /** 刷新中断（页面刷新后恢复时标记） */
  INTERRUPTED = 'INTERRUPTED',
}

/**
 * 传输类型枚举
 */
export enum TransferType {
  /** 上传 */
  UPLOAD = 'UPLOAD',
  /** 下载 */
  DOWNLOAD = 'DOWNLOAD',
}

/**
 * 传输任务来源平台
 */
export enum TransferTaskPlatform {
  /** Web 端 */
  WEB = 'WEB',
  /** Android 端 */
  ANDROID = 'ANDROID',
  /** Harmony 端 */
  HARMONY = 'HARMONY',
}

/**
 * 传输任务数据结构
 */
export interface TransferTask {
  /** 任务唯一 ID（UUID） */
  taskId: string
  /** 任务名称 */
  taskName: string
  /** 任务图标标识 */
  taskIcon: string
  /** 任务状态 */
  taskStatus: TransferTaskStatus
  /** 传输类型 */
  transferType: TransferType
  /** 来源平台 */
  originPlatform: TransferTaskPlatform
  /** 总传输大小（字节） */
  totalSize: number
  /** 已传输大小（字节） */
  loadedSize: number
  /** 传输进度 0~100，保留 2 位小数 */
  progress: number
  /** 传输速度（字节/秒） */
  speed: number
  /** 任务创建时间戳（毫秒） */
  createTime: number
  /** 任务完成时间戳（毫秒） */
  finishTime?: number
  /** 错误信息（失败时填充） */
  errorMessage?: string
  /** 负载数据（透传业务侧参数） */
  payload: Record<string, unknown>
}
