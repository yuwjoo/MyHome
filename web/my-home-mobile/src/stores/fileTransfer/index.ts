import { ref } from 'vue'
import { defineStore } from 'pinia'
import { TransferTaskStatus } from './types'
import type { TransferTask } from './types'
import { createTransferTask } from './transferTask'
import type { CreateTransferTaskOptions } from './transferTask'

/** 任务回调 */
interface TransferCallbacks {
  /** 传输开始前回调 */
  onBeforeTransfer?: (task: TransferTask) => void
  /** 传输执行回调 */
  onTransfer?: (task: TransferTask) => void
}

/** createTask 入参（扩展任务属性 + 回调） */
interface CreateTaskOptions extends CreateTransferTaskOptions {
  /** 传输开始前回调 */
  onBeforeTransfer?: (task: TransferTask) => void
  /** 传输执行回调 */
  onTransfer?: (task: TransferTask) => void
}

/**
 * 文件传输任务管理 Store
 * 管理任务列表，提供创建、删除功能
 */
export const useFileTransferStore = defineStore('fileTransfer', () => {
  // =============================== State ===============================

  /** 所有传输任务列表 */
  const taskList = ref<TransferTask[]>([])

  /** 任务回调 Map（函数不可序列化，单独存储） */
  const callbackMap = new Map<string, TransferCallbacks>()

  // ============================== Actions ==============================

  /**
   * 创建传输任务并加入列表
   * @param options 任务属性 + 可选回调
   * @returns 创建的响应式 TransferTask 对象
   */
  function createTask(options: CreateTaskOptions): TransferTask {
    const { onBeforeTransfer, onTransfer, ...taskOptions } = options

    const task = createTransferTask(taskOptions)
    taskList.value.push(task)

    // 存储回调
    if (onBeforeTransfer || onTransfer) {
      callbackMap.set(task.taskId, { onBeforeTransfer, onTransfer })
    }

    // 触发前置回调
    if (onBeforeTransfer) {
      onBeforeTransfer(task)
    }

    return task
  }

  /**
   * 删除任务
   * @param taskId 任务 ID
   */
  function deleteTask(taskId: string): void {
    const index = taskList.value.findIndex((t) => t.taskId === taskId)
    if (index === -1) return

    taskList.value.splice(index, 1)
    callbackMap.delete(taskId)
  }

  /**
   * 获取任务回调
   * @param taskId 任务 ID
   */
  function getTaskCallbacks(taskId: string): TransferCallbacks | undefined {
    return callbackMap.get(taskId)
  }

  /**
   * 开始执行任务（触发 onTransfer 回调）
   * @param taskId 任务 ID
   */
  function startTransfer(taskId: string): void {
    const task = taskList.value.find((t) => t.taskId === taskId)
    if (!task) return

    task.taskStatus = TransferTaskStatus.UPLOADING
    const callbacks = callbackMap.get(taskId)
    if (callbacks?.onTransfer) {
      callbacks.onTransfer(task)
    }
  }

  // ================================ 导出 ===============================

  return {
    taskList,
    createTask,
    deleteTask,
    getTaskCallbacks,
    startTransfer,
  }
}, {
  persist: {
    key: 'pinia-file-transfer',
    storage: localStorage,
  },
})
