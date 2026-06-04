/**
 * useWebPublish - Web 项目发布 Hook
 * 管理 Web 项目的完整发布流程：更新版本 → 构建 → 发布
 */
import { ref, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { WEB_PROJECT_PATH } from '@/config/projects';
import type { LogEntry, PublishTask, BuildStatus } from '@/types/useWebPublish';

/** Web 项目发布流程 Hook */
export function useWebPublish() {
  // ── 状态 ──
  const currentTask = ref<PublishTask | null>(null);
  const isPublishing = ref(false);

  // ── 日志辅助 ──
  const addLog = (task: PublishTask, level: LogEntry['level'], message: string) => {
    task.logs.push({ timestamp: Date.now(), level, message });
  };

  const setStatus = (task: PublishTask, status: BuildStatus) => {
    task.status = status;
  };

  // ── 核心流程 ──

  /**
   * 注册实时日志监听（注册一次，通过 taskId 区分任务）
   */
  let listenerRegistered = false;
  const api = window.electronAPI;

  function ensureListener() {
    if (listenerRegistered) return;
    api.onCommandOutput(onOutput);
    listenerRegistered = true;
  }

  function onOutput(data: { taskId: string; type: 'stdout' | 'stderr'; data: string }) {
    const task = currentTask.value;
    if (!task || data.taskId !== task.id) return;
    const lines = data.data.split('\n').filter((l) => l.trim());
    for (const line of lines) {
      const level: LogEntry['level'] = data.type === 'stderr' ? 'warn' : 'info';
      const trimmed = line.trim();
      if (trimmed) {
        addLog(task, level, trimmed);
      }
    }
  }

  function removeListener() {
    if (listenerRegistered) {
      api.removeCommandOutputListener();
      listenerRegistered = false;
    }
  }

  /**
   * 启动发布任务
   * 执行完整流程：更新版本 → 构建 → 发布
   *
   * @param task - 发布任务对象
   */
  async function startPublish(task: PublishTask): Promise<void> {
    currentTask.value = task;
    isPublishing.value = true;
    ensureListener();

    const projectPath = WEB_PROJECT_PATH;
    const pkgPath = `${projectPath}/package.json`;

    addLog(task, 'info', `🚀 开始发布 Web 移动端 - ${task.version}`);

    try {
      // ── 步骤 1：更新 package.json 版本号 ──
      addLog(task, 'info', `📋 更新 package.json 版本号为 ${task.version}...`);
      try {
        const raw = await api.readFile(pkgPath);
        const pkg = JSON.parse(raw);
        pkg.version = task.version;
        await api.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
        addLog(task, 'info', `✅ package.json 版本号已更新为 ${task.version}`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(`更新 package.json 失败: ${msg}`);
      }

      task.progress = 15;

      // ── 步骤 2：执行构建命令 ──
      addLog(task, 'info', '🔧 开始构建 Web 项目...');
      addLog(task, 'info', `📂 工作目录: ${projectPath}`);
      setStatus(task, 'publishing');
      task.progress = 20;

      const buildResult = await api.spawnCommand('npm run build', projectPath, task.id);

      if (buildResult.code !== 0) {
        throw new Error(`构建失败，退出码: ${buildResult.code}`);
      }
      addLog(task, 'info', '✅ 构建完成');

      task.progress = 60;

      // ── 步骤 3：执行发布命令 ──
      addLog(task, 'info', '🚀 开始发布 Web 资源...');
      task.progress = 65;

      const publishResult = await api.spawnCommand('npm run publish', projectPath, task.id);

      if (publishResult.code !== 0) {
        throw new Error(`发布失败，退出码: ${publishResult.code}`);
      }
      addLog(task, 'info', '✅ 发布完成');

      // ── 完成 ──
      task.progress = 100;
      setStatus(task, 'success');
      addLog(task, 'info', '🎉 Web 项目发布成功');
      ElMessage.success('Web 项目发布成功');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      addLog(task, 'error', `❌ ${msg}`);
      setStatus(task, 'failed');
      throw err;
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
      removeListener();
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

  // ── 组件卸载时清理 ──
  onUnmounted(() => {
    removeListener();
  });

  return {
    currentTask,
    isPublishing,
    startPublish,
    cancelPublish,
    clearLogs,
  };
}
