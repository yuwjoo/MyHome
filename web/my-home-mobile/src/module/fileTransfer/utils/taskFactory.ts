import { reactive } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import {
  TransferTaskStatus,
  TransferType,
  TransferTaskPlatform,
} from '../types/task'
import type { TransferTask } from '../types/task'

/**
 * createTransferTask 入参
 */
export interface CreateTransferTaskOptions {
  /** 任务名称 */
  taskName: string
  /** 任务图标标识 */
  taskIcon: string
  /** 传输类型（上传 / 下载） */
  transferType: TransferType
  /** 总传输大小（字节） */
  totalSize: number
  /** 来源平台，默认 WEB */
  originPlatform?: TransferTaskPlatform
  /** 负载数据（透传业务侧参数） */
  payload?: Record<string, unknown>
}

/**
 * 创建传输任务
 * 生成 UUID，填充默认字段，返回响应式 TransferTask 对象
 */
export function createTransferTask(
  options: CreateTransferTaskOptions
): TransferTask {
  const {
    taskName,
    taskIcon,
    transferType,
    totalSize,
    originPlatform = TransferTaskPlatform.WEB,
    payload = {},
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
    errorMessage: undefined,
    payload,
  })
}
