/**
 * useAndroidPublish - Android 项目构建发布 Hook
 * 通过 bridge 模块调用主进程发布流程
 */
import { ElMessage } from 'element-plus';
import type { PublishTask } from '@/types/usePublishTask';
import { bridge } from '@/module/bridge';
import { usePublishTask } from '@/composables/usePublishTask';

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
  const {
    currentTask,
    isPublishing,
    addLog,
    setStatus,
    cancelPublish,
    clearLogs,
    wrapPublish,
  } = usePublishTask();

  /**
   * 启动 Android 发布任务
   */
  function startPublish(task: PublishTask): Promise<void> {
    const versionCode = versionToCode(task.version);

    addLog(task, 'info', `🚀 开始发布 Android MyHome - v${task.version} (code: ${versionCode})`);

    return wrapPublish(task, () =>
      new Promise<void>((resolve) => {
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
            } else if (data.step === '上传 OSS') task.progress = 65;
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
            resolve();
          },
          onError: (data) => {
            addLog(task, 'error', `❌ ${data.message}`);
            setStatus(task, 'failed');
            resolve();
          },
        });
      }),
    );
  }

  return {
    currentTask,
    isPublishing,
    startPublish,
    cancelPublish,
    clearLogs,
  };
}
