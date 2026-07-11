/**
 * usePublishTask - 发布任务公共 Hook
 * 管理任务状态、日志、取消/清空等通用逻辑，供各平台发布 Hook 复用
 */
import { ref } from 'vue';
import type { LogEntry, BuildStatus, PublishTask } from '@/types/usePublishTask';

export function usePublishTask() {
  const currentTask = ref<PublishTask | null>(null);
  const isPublishing = ref(false);

  /**
   * 向当前任务添加一条日志
   * 通过 currentTask.value 响应式代理写入，确保 Vue 能追踪数组变化
   */
  function addLog(level: LogEntry['level'], message: string) {
    if (currentTask.value) {
      currentTask.value.logs.push({ timestamp: Date.now(), level, message });
    }
  }

  /**
   * 设置当前任务状态
   * 通过 currentTask.value 响应式代理写入
   */
  function setStatus(status: BuildStatus) {
    if (currentTask.value) {
      currentTask.value.status = status;
    }
  }

  /** 取消当前发布任务 */
  function cancelPublish() {
    if (currentTask.value) {
      addLog('warn', '⚠️ 发布已被用户取消');
      setStatus('failed');
      currentTask.value.endTime = Date.now();
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
   * 包裹平台发布流程，统一管理任务生命周期
   */
  async function wrapPublish(task: PublishTask, execute: () => Promise<void>): Promise<void> {
    currentTask.value = task;
    isPublishing.value = true;

    try {
      await execute();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      addLog('error', `❌ ${msg}`);
      setStatus('failed');
    } finally {
      if (currentTask.value) {
        currentTask.value.endTime = Date.now();
      }
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
