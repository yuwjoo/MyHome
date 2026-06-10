import { reactive } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import {
  TransferTaskStatus,
  TransferType,
  TransferTaskPlatform,
} from './types'
import type { TransferTask } from './types'

/** createTransferTask 入参 */
export interface CreateTransferTaskOptions {
  /** 任务名称 */
  taskName: string
  /** 任务图标 */
  taskIcon: string
  /** 传输类型（上传 / 下载） */
  transferType: TransferType
  /** 总传输大小（字节） */
  totalSize: number
  /** 来源平台，默认 web */
  originPlatform?: TransferTaskPlatform
  /** 负载数据 */
  payload?: any
}

/**
 * 创建传输任务
 * 接收任务信息，返回一个响应式 TransferTask 对象
 *
 * @param options 任务创建参数
 * @returns 响应式 TransferTask 对象
 *
 * @example
 * ```ts
 * const task = createTransferTask({
 *   taskName: 'photo.jpg',
 *   taskIcon: 'image',
 *   transferType: TransferType.UPLOAD,
 *   totalSize: 1024000,
 * })
 * task.taskStatus = TransferTaskStatus.UPLOADING
 * task.progress = 50
 * ```
 */
export function createTransferTask(options: CreateTransferTaskOptions): TransferTask {
  const {
    taskName,
    taskIcon,
    transferType,
    totalSize,
    originPlatform = TransferTaskPlatform.WEB,
    payload,
  } = options

  return reactive<TransferTask>({
    taskId: uuidv4(),
    taskName,
    taskIcon,
    taskStatus: TransferTaskStatus.WAITING,
    originPlatform,
    transferType,
    totalSize,
    loadedSize: 0,
    progress: 0,
    speed: 0,
    createTime: Date.now(),
    finishTime: undefined,
    payload,
  })
}
