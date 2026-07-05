import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { TransferTaskStatus, TransferType } from '../types/task'
import type { TransferTask } from '../types/task'
import { createTransferTask } from '../utils/taskFactory'
import type { CreateTransferTaskOptions } from '../utils/taskFactory'
import { TransferEngine } from '../engine'
import type { TransportExecutor } from '../types/executor'
import { createExecutor as _defaultExecutorFactory } from '../executors'

// ============================================================================
// 类型
// ============================================================================

/** 按状态过滤的 getters 返回值 */
export interface FileTransferGetters {
  activeTasks: TransferTask[]
  waitingTasks: TransferTask[]
  failedTasks: TransferTask[]
  completedTasks: TransferTask[]
  activeCount: number
}

// ============================================================================
// Store
// ============================================================================

/**
 * 文件传输任务管理 Store
 * 管理任务列表，提供创建、删除、控制等完整 API
 * 内置默认执行器工厂，开箱即用
 */
export const useFileTransferStore = defineStore('fileTransfer', () => {
  // =============================== State ====================================

  /** 所有传输任务列表（响应式） */
  const taskList = ref<TransferTask[]>([])

  /** 并发配置：上传 / 下载各自限制 */
  const concurrency = ref<{ upload: number; download: number }>({
    upload: 2,
    download: 3,
  })

  // ========================== Engine 实例 ================================

  /** 执行器工厂（默认使用内置实现，可通过 setExecutorFactory 覆盖） */
  let _executorFactory: (type: TransferType) => TransportExecutor = _defaultExecutorFactory

  function setExecutorFactory(
    factory: (type: TransferType) => TransportExecutor
  ): void {
    _executorFactory = factory
  }

  /** 创建 Engine 实例 */
  const engine = new TransferEngine(
    () => concurrency.value,
    (type: TransferType) => _executorFactory(type)
  )

  // ============================= Getters ====================================

  /** 传输中的任务 */
  const activeTasks = computed(() =>
    taskList.value.filter(
      (t) => t.taskStatus === TransferTaskStatus.TRANSFERRING
    )
  )

  /** 排队中的任务 */
  const waitingTasks = computed(() =>
    taskList.value.filter(
      (t) => t.taskStatus === TransferTaskStatus.WAITING
    )
  )

  /** 失败 / 中断的任务 */
  const failedTasks = computed(() =>
    taskList.value.filter(
      (t) =>
        t.taskStatus === TransferTaskStatus.FAILED ||
        t.taskStatus === TransferTaskStatus.INTERRUPTED
    )
  )

  /** 已完成的任务（成功 / 取消 / 暂停） */
  const completedTasks = computed(() =>
    taskList.value.filter(
      (t) =>
        t.taskStatus === TransferTaskStatus.SUCCESS ||
        t.taskStatus === TransferTaskStatus.CANCELED ||
        t.taskStatus === TransferTaskStatus.PAUSED
    )
  )

  /** 当前传输中任务数 */
  const activeCount = computed(() => activeTasks.value.length)

  // ============================== Actions ===================================

  /**
   * 创建传输任务并加入列表，自动入队调度
   * @param options 任务创建参数
   * @returns 创建的响应式 TransferTask 对象
   */
  function createTask(
    options: CreateTransferTaskOptions
  ): TransferTask {
    const task = createTransferTask(options)
    taskList.value.push(task)
    engine.enqueue(task)
    return task
  }

  /**
   * 删除任务（仅终态可删除）
   * @param taskId 任务 ID
   */
  function deleteTask(taskId: string): void {
    const task = taskList.value.find((t) => t.taskId === taskId)
    if (!task) return

    const status = task.taskStatus
    if (
      status !== TransferTaskStatus.SUCCESS &&
      status !== TransferTaskStatus.FAILED &&
      status !== TransferTaskStatus.CANCELED &&
      status !== TransferTaskStatus.INTERRUPTED
    ) {
      return
    }

    const index = taskList.value.findIndex((t) => t.taskId === taskId)
    if (index !== -1) {
      taskList.value.splice(index, 1)
    }
  }

  /**
   * 暂停任务（委托 Engine）
   * @param taskId 任务 ID
   */
  function pauseTask(taskId: string): void {
    engine.pauseTask(taskId)
  }

  /**
   * 恢复任务（重新入队）
   * @param taskId 任务 ID
   */
  function resumeTask(taskId: string): void {
    const task = taskList.value.find((t) => t.taskId === taskId)
    if (!task) return
    if (task.taskStatus !== TransferTaskStatus.PAUSED) return
    task.taskStatus = TransferTaskStatus.WAITING
    engine.enqueue(task)
  }

  /**
   * 取消任务（委托 Engine）
   * @param taskId 任务 ID
   */
  function cancelTask(taskId: string): void {
    engine.cancelTask(taskId)
  }

  /**
   * 重试任务（重置进度，重新入队）
   * @param taskId 任务 ID
   */
  function retryTask(taskId: string): void {
    const task = taskList.value.find((t) => t.taskId === taskId)
    if (!task) return
    if (
      task.taskStatus !== TransferTaskStatus.FAILED &&
      task.taskStatus !== TransferTaskStatus.INTERRUPTED
    ) {
      return
    }
    task.loadedSize = 0
    task.progress = 0
    task.speed = 0
    task.errorMessage = undefined
    task.finishTime = undefined
    task.taskStatus = TransferTaskStatus.WAITING
    engine.enqueue(task)
  }

  /**
   * 清除所有终态任务
   */
  function clearCompleted(): void {
    const terminalStates = [
      TransferTaskStatus.SUCCESS,
      TransferTaskStatus.FAILED,
      TransferTaskStatus.CANCELED,
      TransferTaskStatus.INTERRUPTED,
    ]
    taskList.value = taskList.value.filter(
      (t) => !terminalStates.includes(t.taskStatus)
    )
  }

  /**
   * 页面刷新恢复：将 TRANSFERRING 状态的任务标记为 INTERRUPTED
   * 在 Store 初始化后由调用方调用
   */
  function recoverInterruptedTasks(): void {
    taskList.value.forEach((task) => {
      if (task.taskStatus === TransferTaskStatus.TRANSFERRING) {
        task.taskStatus = TransferTaskStatus.INTERRUPTED
        task.speed = 0
      }
    })
  }

  // ============================== 初始化 =================================

  // Store 创建后自动恢复中断任务（持久化已还原）
  recoverInterruptedTasks()

  // ================================ 导出 ===================================

  return {
    // State
    taskList,
    concurrency,
    // Getters
    activeTasks,
    waitingTasks,
    failedTasks,
    completedTasks,
    activeCount,
    // Actions
    createTask,
    deleteTask,
    pauseTask,
    resumeTask,
    cancelTask,
    retryTask,
    clearCompleted,
    recoverInterruptedTasks,
    setExecutorFactory,
  }
}, {
  persist: {
    key: 'file-transfer-tasks',
    storage: localStorage,
    pick: ['taskList', 'concurrency'],
  },
})
