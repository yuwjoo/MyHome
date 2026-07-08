/**
 * useAndroidPublish - Android 项目构建发布 Hook
 * 通过 bridge 模块调用主进程发布流程，利用回调管理 UI 状态
 */
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import type { LogEntry, PublishTask, BuildStatus } from '@/types/useWebPublish';
import { bridge } from '@/module/bridge';

/**
 * 版本号字符串解析为三段数字
 */
function parseVersion(version: string): { major: number; minor: number; patch: number } {
  const parts = version.split('.').map(Number);
  return {
    major: !isNaN(parts[0]) ? parts[0] : 0,
    minor: !isNaN(parts[1]) ? parts[1] : 0,
    patch: !isNaN(parts[2]) ? parts[2] : 0,
  };
}

/**
 * 语义化版本号转为 Android versionCode
 */
function versionToCode(version: string): number {
  const { major, minor, patch } = parseVersion(version);
  return major * 10000 + minor * 100 + patch;
}

/**
 * Android 项目发布流程 Hook
 */
export function useAndroidPublish() {
  const currentTask = ref<PublishTask | null>(null);
  const isPublishing = ref(false);

  const addLog = (task: PublishTask, level: LogEntry['level'], message: string) => {
    task.logs.push({ timestamp: Date.now(), level, message });
  };

  const setStatus = (task: PublishTask, status: BuildStatus) => {
    task.status = status;
  };

  /**
   * 启动 Android 发布任务
   *
   * @param task 发布任务对象
   */
  async function startPublish(task: PublishTask): Promise<void> {
    currentTask.value = task;
    isPublishing.value = true;

    const versionCode = versionToCode(task.version);

    addLog(task, 'info', `🚀 开始发布 Android MyHome - v${task.version} (code: ${versionCode})`);

    try {
      bridge.send('android', 'publishMyHome', { version: task.version, versionCode }, {
        onProgress: (data) => {
          const info = data.versionCode !== undefined
            ? `${data.step}: versionName=${data.version} versionCode=${data.versionCode}`
            : data.step;
          addLog(task, 'info', `📋 ${info}`);
          if (data.step === '更新版本号') task.progress = 10;
          else if (data.step === '执行构建') {
            setStatus(task, 'publishing');
            task.progress = 25;
          }
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
          addLog(task, 'info', `🎉 Android MyHome 发布成功，地址: ${data.url}`);
          ElMessage.success('Android 项目发布成功');
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
