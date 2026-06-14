import { TransferType } from '../types/task'
import type { TransportExecutor } from '../types/executor'
import { UploadExecutor } from './upload'
import { DownloadExecutor } from './download'

/**
 * 默认执行器工厂
 * 根据传输类型创建对应的 Executor 实例
 */
export function createExecutor(type: TransferType): TransportExecutor {
  switch (type) {
    case TransferType.UPLOAD:
      return new UploadExecutor()
    case TransferType.DOWNLOAD:
      return new DownloadExecutor()
    default:
      throw new Error(`未知传输类型：${type}`)
  }
}
