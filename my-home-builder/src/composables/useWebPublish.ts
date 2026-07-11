/**
 * useWebPublish - Web 项目发布 Hook
 * 通过 bridge 模块调用主进程发布流程
 */
import { ElMessage } from 'element-plus';
import type { PublishTask } from '@/types/usePublishTask';
import { bridge } from '@/module/bridge';
import { usePublishTask } from '@/composables/usePublishTask';

/**
 * Web 项目发布流程 Hook
 */
export function useWebPublish() {
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
   * 启动 Web 发布任务
   */
  function startPublish(task: PublishTask): Promise<void> {
    return wrapPublish(task, () =>
      new Promise<void>((resolve) => {
        addLog('info', `🚀 开始发布 Web 移动端 - ${task.version}`);

        bridge.send('web', 'publishMyHomeMobile', { version: task.version }, {
          onProgress: (data) => {
            addLog('info', `📋 ${data.step}${data.version ? `: ${data.version}` : ''}`);
            if (data.step === '更新版本号') task.progress = 15;
            else if (data.step === '执行构建') {
              setStatus('publishing');
              task.progress = 20;
            } else if (data.step === '压缩打包') task.progress = 60;
            else if (data.step === '上传 OSS') task.progress = 65;
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
            addLog('info', `🎉 Web 项目发布成功，地址: ${data.url}`);
            ElMessage.success('Web 项目发布成功');
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
