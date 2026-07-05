import type { TransferTask } from '../types/task'
import type { TransportExecutor, ExecutorCallbacks } from '../types/executor'
import { uploadToOssAbortable } from '../utils/ossUpload'

/**
 * 上传执行器
 * 实现 TransportExecutor 接口，封装完整上传流程
 */
export class UploadExecutor implements TransportExecutor {
  /** uploadToOssAbortable 返回的 result 引用（xhr 在异步过程中赋值，需保持引用） */
  private _result: { promise: Promise<string>; xhr: XMLHttpRequest | null } | null = null

  /**
   * 执行上传
   * 流程：hash 计算 → 获取签名 → 秒传跳过 / XHR PUT 直传
   */
  async start(task: TransferTask, callbacks: ExecutorCallbacks): Promise<void> {
    const file = (task.payload as Record<string, unknown>).file as File
    if (!file) {
      throw new Error('UploadExecutor: task.payload.file 不存在')
    }

    this._result = uploadToOssAbortable(file, {
      onProgress: (percent: number) => {
        const loaded = Math.round((percent / 100) * file.size)
        callbacks.onProgress(loaded, file.size)
      },
    })

    const ossObjectRefId = await this._result.promise
    task.payload = { ...task.payload, ossObjectRefId }
  }

  /**
   * 暂停上传（abort XHR）
   */
  pause(): void {
    const xhr = this._result?.xhr
    if (xhr) {
      xhr.abort()
    }
    this._result = null
  }

  /**
   * 取消上传并清理
   */
  cancel(): void {
    this.pause()
  }
}
