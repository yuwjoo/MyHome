import type { TransferTask } from "./task"

/**
 * 传输执行器抽象接口
 * 所有上传/下载实现必须遵循此接口
 */
export interface TransportExecutor {
  /**
   * 执行传输
   * 完成时报 resolve，失败时将错误消息传入 reject
   */
  start(task: TransferTask, callbacks: ExecutorCallbacks): Promise<void>

  /** 暂停传输（中断当前传输，状态由 Engine 变更） */
  pause(): void

  /** 取消传输并清理资源（状态由 Engine 变更） */
  cancel(): void
}

/**
 * 执行器回调
 * Engine 通过此回调回写进度和速度
 */
export interface ExecutorCallbacks {
  /** 进度更新：已传输字节数、总字节数 */
  onProgress: (loaded: number, total: number) => void
  /** 速度变化：当前瞬时速度（字节/秒） */
  onSpeedChange: (speed: number) => void
}
