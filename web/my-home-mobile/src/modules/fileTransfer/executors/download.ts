import type { TransferTask } from '../types/task'
import type { TransportExecutor, ExecutorCallbacks } from '../types/executor'

/**
 * 下载执行器
 * 实现 TransportExecutor 接口，封装完整下载流程
 */
export class DownloadExecutor implements TransportExecutor {
  /** 当前 XHR 实例（用于 pause/cancel 时 abort） */
  private xhr: XMLHttpRequest | null = null

  /**
   * 执行下载
   * 流程：XHR GET → blob → 触发浏览器下载
   */
  async start(task: TransferTask, callbacks: ExecutorCallbacks): Promise<void> {
    const downloadUrl = (task.payload as Record<string, unknown>).downloadUrl as string
    if (!downloadUrl) {
      throw new Error('DownloadExecutor: task.payload.downloadUrl 不存在')
    }

    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      this.xhr = xhr

      xhr.open('GET', downloadUrl, true)
      xhr.responseType = 'blob'

      xhr.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          callbacks.onProgress(e.loaded, e.total)
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const blob = xhr.response as Blob
          const blobUrl = URL.createObjectURL(blob)

          const link = document.createElement('a')
          link.href = blobUrl
          link.download = task.taskName
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)

          URL.revokeObjectURL(blobUrl)

          callbacks.onProgress(task.totalSize, task.totalSize)
          resolve()
        } else {
          reject(new Error(`下载失败，状态码 ${xhr.status}`))
        }
      })

      xhr.addEventListener('error', () => {
        reject(new Error('下载网络请求失败'))
      })

      xhr.send()
    })
  }

  /**
   * 暂停下载（abort XHR）
   */
  pause(): void {
    if (this.xhr) {
      this.xhr.abort()
      this.xhr = null
    }
  }

  /**
   * 取消下载并清理
   */
  cancel(): void {
    this.pause()
  }
}
