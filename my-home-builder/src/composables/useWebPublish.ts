/**
 * useWebPublish - Web 项目发布 Hook
 * 通过 bridge 模块调用主进程发布流程，利用回调管理 UI 状态
 */
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import type { LogEntry, PublishTask, BuildStatus } from '@/types/useWebPublish';
import { bridge } from '@/module/bridge';

/**
 * Web 项目发布流程 Hook
 */
export function useWebPublish() {
  const currentTask = ref<PublishTask | null>(null);
  const isPublishing = ref(false);

  const addLog = (task: PublishTask, level: LogEntry['level'], message: string) => {
    task.logs.push({ timestamp: Date.now(), level, message });
  };

  const setStatus = (task: PublishTask, status: BuildStatus) => {
    task.status = status;
  };

  /**
   * 启动发布任务
   *
   * @param task 发布任务对象
   */
  async function startPublish(task: PublishTask): Promise<void> {
    currentTask.value = task;
    isPublishing.value = true;

    addLog(task, 'info', `🚀 开始发布 Web 移动端 - ${task.version}`);

    try {
      bridge.send('web', 'publishMyHomeMobile', { version: task.version }, {
        onProgress: (data) => {
          addLog(task, 'info', `📋 ${data.step}${data.version ? `: ${data.version}` : ''}`);
          if (data.step === '更新版本号') task.progress = 15;
          else if (data.step === '执行构建') {
            setStatus(task, 'publishing');
            task.progress = 20;
          }
          else if (data.step === '压缩打包') task.progress = 60;
          else if (data.step === '上传 OSS') task.progress = 65;
        },
        onBuildOutput: (data) => {
          const lines = data.data.split('\n').filter((l) => l.trim());
          for (const line of lines) {
            addLog(task, 'info', line.trim());
          }
        },
        onSuccess: (data) => {
          task.progress = 100;
          setStatus(task, 'success');
          addLog(task, 'info', `🎉 Web 项目发布成功，地址: ${data.url}`);
          ElMessage.success('Web 项目发布成功');
        },
        onError: (data) => {
          addLog(task, 'error', `❌ ${data.message}`);
          setStatus(task, 'failed');
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      addLog(task, 'error', `❌ ${msg}`);
      setStatus(task, 'failed');
    } finally {
      task.endTime = Date.now();
      isPublishing.value = false;
    }
  }

  /**
   * 取消当前发布任务
   */
  function cancelPublish() {
    if (currentTask.value) {
      addLog(currentTask.value, 'warn', '⚠️ 发布已被用户取消');
      setStatus(currentTask.value, 'failed');
      isPublishing.value = false;
    }
  }

  /**
   * 清空当前任务日志
   */
  function clearLogs() {
    if (currentTask.value) {
      currentTask.value.logs = [];
    }
  }

  return {
    currentTask,
    isPublishing,
    startPublish,
    cancelPublish,
    clearLogs,
  };
}
