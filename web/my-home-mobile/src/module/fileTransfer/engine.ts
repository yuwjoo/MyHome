import {
  TransferTaskStatus,
  TransferType,
} from './types/task'
import type { TransferTask } from './types/task'
import type {
  TransportExecutor,
  ExecutorCallbacks,
} from './types/executor'
import { Speedometer } from './utils/speedometer'

// ============================================================================
// 类型
// ============================================================================

/** 运行中任务的上下文 */
interface RunningContext {
  /** 任务对象（引用 Store 中的响应式对象） */
  task: TransferTask
  /** 当前使用的执行器 */
  executor: TransportExecutor
  /** 速度计算器 */
  speedometer: Speedometer
}

// ============================================================================
// 传输引擎
// ============================================================================

/**
 * TransferEngine 并发调度引擎
 * 维护等待队列和运行中任务，按传输类型限制并发数
 */
export class TransferEngine {
  private waitingQueue: string[] = [] // 等待队列（按入队顺序排列的 taskId）
  private runningMap = new Map<string, RunningContext>() // 运行中任务上下文
  private taskMap = new Map<string, TransferTask>() // 所有入队任务的 taskId → 响应式对象
  private getConcurrency: () => { upload: number; download: number } // 并发配置 getter（由 Store 注入）
  private executorFactory: (type: TransferType) => TransportExecutor // 根据 TransferType 创建 Executor

  /**
   * @param getConcurrency 获取当前并发配置的函数（从 Store 读取）
   * @param executorFactory 根据传输类型创建执行器的工厂函数
   */
  constructor(
    getConcurrency: () => { upload: number; download: number },
    executorFactory: (type: TransferType) => TransportExecutor
  ) {
    this.getConcurrency = getConcurrency
    this.executorFactory = executorFactory
  }

  /**
   * 将任务加入等待队列并尝试调度
   */
  enqueue(task: TransferTask): void {
    if (this.waitingQueue.includes(task.taskId)) return
    if (this.runningMap.has(task.taskId)) return

    this.taskMap.set(task.taskId, task)
    this.waitingQueue.push(task.taskId)
    this.tryPickNext()
  }

  /**
   * 暂停任务
   */
  pauseTask(taskId: string): void {
    const ctx = this.runningMap.get(taskId)
    if (ctx) {
      ctx.executor.pause()
      ctx.speedometer.stop()
      ctx.task.speed = 0
      ctx.task.taskStatus = TransferTaskStatus.PAUSED
      this.runningMap.delete(taskId)
      this.tryPickNext()
      return
    }

    this.removeFromWaitingQueue(taskId)
    const task = this.taskMap.get(taskId)
    if (task) {
      task.taskStatus = TransferTaskStatus.PAUSED
    }
  }

  /**
   * 取消任务
   */
  cancelTask(taskId: string): void {
    const ctx = this.runningMap.get(taskId)
    if (ctx) {
      ctx.executor.cancel()
      ctx.speedometer.stop()
      ctx.task.speed = 0
      ctx.task.taskStatus = TransferTaskStatus.CANCELED
      ctx.task.finishTime = Date.now()
      this.runningMap.delete(taskId)
      this.tryPickNext()
      return
    }

    this.removeFromWaitingQueue(taskId)
    const task = this.taskMap.get(taskId)
    if (task) {
      task.taskStatus = TransferTaskStatus.CANCELED
      task.finishTime = Date.now()
    }
  }

  /**
   * 更新并发配置
   */
  setConcurrency(c: { upload: number; download: number }): void {
    this.getConcurrency = () => c
    this.tryPickNext()
  }

  /**
   * 清理所有运行中任务（页面卸载时调用）
   */
  destroy(): void {
    this.runningMap.forEach((ctx) => {
      ctx.executor.cancel()
      ctx.speedometer.stop()
    })
    this.runningMap.clear()
    this.waitingQueue = []
    this.taskMap.clear()
  }

  /**
   * 尝试从等待队列中按 FIFO 顺序调度任务
   */
  private tryPickNext(): void {
    // 清理队列中已失效的任务
    this.waitingQueue = this.waitingQueue.filter((taskId) => {
      const task = this.taskMap.get(taskId)
      return task && task.taskStatus === TransferTaskStatus.WAITING
    })

    const concurrency = this.getConcurrency()

    for (let i = 0; i < this.waitingQueue.length; i++) {
      const task = this.taskMap.get(this.waitingQueue[i]!)
      if (!task) continue

      const type = task.transferType
      const limit =
        type === TransferType.UPLOAD
          ? concurrency.upload
          : concurrency.download
      const currentCount = this.getRunningCount(type)

      if (currentCount < limit) {
        this.waitingQueue.splice(i, 1)
        i-- // 补偿 splice 后的索引偏移
        this.runTask(task)
      }
    }
  }

  /**
   * 执行单个任务
   */
  private runTask(task: TransferTask): void {
    const executor = this.executorFactory(task.transferType)
    const speedometer = new Speedometer()

    task.taskStatus = TransferTaskStatus.TRANSFERRING
    task.finishTime = undefined

    const callbacks: ExecutorCallbacks = {
      onProgress: (loaded: number, total: number) => {
        task.loadedSize = loaded
        task.progress = total > 0 ? Number(((loaded / total) * 100).toFixed(2)) : 0
        speedometer.update(loaded)
      },
      onSpeedChange: (speed: number) => {
        task.speed = speed
      },
    }

    speedometer.start((speed) => {
      callbacks.onSpeedChange(speed)
    })

    this.runningMap.set(task.taskId, { task, executor, speedometer })

    executor
      .start(task, callbacks)
      .then(() => {
        this.onTaskDone(task.taskId, TransferTaskStatus.SUCCESS)
      })
      .catch((err) => {
        task.errorMessage = err instanceof Error ? err.message : String(err)
        this.onTaskDone(task.taskId, TransferTaskStatus.FAILED)
      })
  }

  /**
   * 任务完成 / 失败后的清理和调度
   */
  private onTaskDone(taskId: string, status: TransferTaskStatus): void {
    const ctx = this.runningMap.get(taskId)
    if (!ctx) return

    ctx.speedometer.stop()
    ctx.task.speed = 0
    ctx.task.taskStatus = status
    ctx.task.finishTime = Date.now()
    this.runningMap.delete(taskId)

    this.tryPickNext()
  }

  /**
   * 从等待队列中移除指定 taskId
   */
  private removeFromWaitingQueue(taskId: string): void {
    const idx = this.waitingQueue.indexOf(taskId)
    if (idx !== -1) {
      this.waitingQueue.splice(idx, 1)
    }
  }

  /**
   * 统计指定类型的运行中任务数
   */
  private getRunningCount(type: TransferType): number {
    let count = 0
    this.runningMap.forEach((ctx) => {
      if (ctx.task.transferType === type) {
        count++
      }
    })
    return count
  }
}
