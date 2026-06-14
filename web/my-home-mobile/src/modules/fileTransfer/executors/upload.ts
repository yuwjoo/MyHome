import type { TransferTask } from '../types/task'
import type { TransportExecutor, ExecutorCallbacks } from '../types/executor'
import { uploadToOssAbortable } from '../utils/ossUpload'

/**
 * 上传执行器
 * 实现 TransportExecutor 接口，封装完整上传流程
 */
export class UploadExecutor implements TransportExecutor {
  /** 当前 XHR 实例（用于 pause/cancel 时 abort） */
  private xhr: XMLHttpRequest | null = null

  /**
   * 执行上传
   * 流程：hash 计算 → 获取签名 → 秒传跳过 / XHR PUT 直传
   */
  async start(task: TransferTask, callbacks: ExecutorCallbacks): Promise<void> {
    const file = (task.payload as Record<string, unknown>).file as File
    if (!file) {
      throw new Error('UploadExecutor: task.payload.file 不存在')
    }

    const { promise, xhr } = uploadToOssAbortable(file, {
      onProgress: (percent: number) => {
        const loaded = Math.round((percent / 100) * file.size)
        callbacks.onProgress(loaded, file.size)
      },
    })

    this.xhr = xhr
    const result = await promise
    task.payload = { ...task.payload, ossObjectRefId: result }
  }

  /**
   * 暂停上传（abort XHR）
   */
  pause(): void {
    if (this.xhr) {
      this.xhr.abort()
      this.xhr = null
    }
  }

  /**
   * 取消上传并清理
   */
  cancel(): void {
    this.pause()
  }
}
