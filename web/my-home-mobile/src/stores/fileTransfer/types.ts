/** 传输任务状态 */
export enum TransferTaskStatus {
  /** 等待中 */
  WAITING = 'WAITING',
  /** 传输中 */
  UPLOADING = 'UPLOADING',
  /** 已暂停 */
  PAUSED = 'PAUSED',
  /** 传输成功 */
  SUCCESS = 'SUCCESS',
  /** 传输失败 */
  FAILED = 'FAILED',
  /** 已取消 */
  CANCELED = 'CANCELED',
}

/** 传输类型 */
export enum TransferType {
  /** 上传 */
  UPLOAD = 'UPLOAD',
  /** 下载 */
  DOWNLOAD = 'DOWNLOAD',
}

/** 传输任务来源平台 */
export enum TransferTaskPlatform {
  /** Web 端 */
  WEB = 'web',
  /** Android 端 */
  ANDROID = 'android',
  /** Harmony 端 */
  HARMONY = 'harmony',
}

/** 传输任务 */
export interface TransferTask {
  /** 任务唯一 ID（UUID） */
  taskId: string
  /** 任务名称 */
  taskName: string
  /** 任务图标 */
  taskIcon: string
  /** 任务状态 */
  taskStatus: TransferTaskStatus
  /** 来源平台 */
  originPlatform: TransferTaskPlatform
  /** 传输类型： 上传 / 下载类型 */
  transferType: TransferType
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
  /** 负载数据  */
  payload?: any
}
