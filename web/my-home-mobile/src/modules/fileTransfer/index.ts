/**
 * 文件传输任务模块 — 统一出口
 *
 * 外部引入方式：
 *   import { useFileTransferStore, TransferType } from '@/modules/fileTransfer'
 */

export { useFileTransferStore } from './stores/fileTransfer'

export { TransferTaskStatus, TransferType, TransferTaskPlatform } from './types/task'
export type { TransferTask } from './types/task'

export type { TransportExecutor, ExecutorCallbacks } from './types/executor'

export { createExecutor as defaultExecutorFactory } from './executors'
