/**
 * usePublishTask - 发布任务公共 Hook
 * 管理任务状态、日志、取消/清空等通用逻辑，供各平台发布 Hook 复用
 */
import { ref } from 'vue';
import type { LogEntry, PublishTask, BuildStatus } from '@/types/usePublishTask';

export function usePublishTask() {
  const currentTask = ref<PublishTask | null>(null);
  const isPublishing = ref(false);

  /** 向任务添加一条日志 */
  const addLog = (task: PublishTask, level: LogEntry['level'], message: string) => {
    task.logs.push({ timestamp: Date.now(), level, message });
  };

  /** 设置任务状态 */
  const setStatus = (task: PublishTask, status: BuildStatus) => {
    task.status = status;
  };

  /** 取消当前发布任务 */
  function cancelPublish() {
    if (currentTask.value) {
      addLog(currentTask.value, 'warn', '⚠️ 发布已被用户取消');
      setStatus(currentTask.value, 'failed');
      isPublishing.value = false;
    }
  }

  /** 清空当前任务日志 */
  function clearLogs() {
    if (currentTask.value) {
      currentTask.value.logs = [];
    }
  }

  /**
   * 包裹平台发布流程，统一管理任务生命周期：
   * - 设置 currentTask / isPublishing
   * - 统一 catch 错误日志
   * - finally 中清理 endTime / isPublishing
   */
  async function wrapPublish(task: PublishTask, execute: () => Promise<void>): Promise<void> {
    currentTask.value = task;
    isPublishing.value = true;

    try {
      await execute();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      addLog(task, 'error', `❌ ${msg}`);
      setStatus(task, 'failed');
    } finally {
      task.endTime = Date.now();
      isPublishing.value = false;
    }
  }

  return {
    currentTask,
    isPublishing,
    addLog,
    setStatus,
    cancelPublish,
    clearLogs,
    wrapPublish,
  };
}
