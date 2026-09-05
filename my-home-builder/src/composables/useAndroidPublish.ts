/**
 * useAndroidPublish - Android 项目发布 Hook
 * 通过 bridge 模块调用主进程发布流程
 */
import { ElMessage } from 'element-plus';
import type { PublishTask } from '@/types/usePublishTask';
import type { AndroidGroup } from '@/module/bridge/types/group/AndroidGroup';
import { getProjectById } from '@/config/projects';
import { bridge } from '@/module/bridge';
import { usePublishTask } from '@/composables/usePublishTask';

/**
 * Android 项目发布消息名映射
 * projectId → 主进程 androidGroup 中的消息名，需与 main/common/bridge/androidGroup.ts 保持一致
 */
const publishMessageMap: Record<string, keyof AndroidGroup> = {
  'android-myhome': 'publishMyHome',
  'android-myhome-recipe': 'publishMyHomeRecipe',
};

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
    const messageName = publishMessageMap[task.projectId] ?? 'publishMyHome';

    const projectName = getProjectById(task.projectId)?.name ?? task.projectId;

    return wrapPublish(task, () =>
      new Promise<void>((resolve) => {
        addLog('info', `🚀 开始发布 Android ${projectName} - v${task.version}`);

        bridge.send('android', messageName, { version: task.version }, {
          onProgress: (data) => {
            const info = data.versionCode !== undefined
              ? `${data.step}: versionName=${data.version} versionCode=${data.versionCode}`
              : data.step;
            addLog('info', `📋 ${info}`);
            if (data.step === '更新版本号') task.progress = 10;
            else if (data.step === '执行构建') {
              setStatus('publishing');
              task.progress = 25;
            } else if (data.step === '上传 OSS') task.progress = 65;
          },
          onBuildOutput: (data) => {
            const lines = data.data.split('\n').filter((l) => l.trim());
            for (const line of lines) {
              addLog('info', line.trim());
            }
          },
          onSuccess: (data) => {
            task.progress = 100;
            setStatus('success');
            addLog('info', `🎉 Android ${projectName} 发布成功，地址: ${data.url}`);
            ElMessage.success('Android 项目发布成功');
            resolve();
          },
          onError: (data) => {
            addLog('error', `❌ ${data.message}`);
            setStatus('failed');
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
