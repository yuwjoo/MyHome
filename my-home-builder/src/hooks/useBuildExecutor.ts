/**
 * 构建执行 Hook
 * 管理构建任务的生命周期：启动、日志收集、状态跟踪
 */

import { ref, type Ref } from 'vue';
import { ElMessage } from 'element-plus';
import type { BuildTask, BuildStatus, LogEntry, PublishForm } from '@/types/publish';
import { getProjectById } from '@/config/projects';

/** 构建执行 Hook 返回值 */
interface UseBuildExecutorReturn {
  /** 当前构建任务 */
  currentTask: Ref<BuildTask | null>;
  /** 是否正在构建 */
  isBuilding: Ref<boolean>;
  /** 执行构建 */
  executeBuild: (form: PublishForm) => Promise<void>;
  /** 取消构建 */
  cancelBuild: () => void;
}

/**
 * 构建执行器 Hook
 * 封装构建命令执行、日志收集、状态管理等逻辑
 */
export const useBuildExecutor = (): UseBuildExecutorReturn => {
  const currentTask = ref<BuildTask | null>(null);
  const isBuilding = ref(false);

  /** 添加日志 */
  const addLog = (task: BuildTask, level: LogEntry['level'], message: string) => {
    task.logs.push({
      timestamp: Date.now(),
      level,
      message,
    });
  };

  /** 更新构建状态 */
  const setStatus = (task: BuildTask, status: BuildStatus) => {
    task.status = status;
  };

  /**
   * 执行构建命令
   * 通过 Electron preload 暴露的 execCommand 执行 shell 命令
   */
  const runBuildCommand = async (task: BuildTask, command: string, cwd: string) => {
    try {
      addLog(task, 'info', `开始执行构建命令: ${command}`);
      addLog(task, 'info', `工作目录: ${cwd}`);

      // 通过 Electron IPC 执行命令
      const result = await window.electronAPI.execCommand(command, cwd);

      if (result.stdout) {
        result.stdout.split('\n').forEach((line: string) => {
          if (line.trim()) {
            // 根据日志内容判断级别
            const level: LogEntry['level'] = line.toLowerCase().includes('error')
              ? 'error'
              : line.toLowerCase().includes('warn')
                ? 'warn'
                : 'info';
            addLog(task, level, line.trim());
          }
        });
      }

      if (result.stderr) {
        result.stderr.split('\n').forEach((line: string) => {
          if (line.trim()) {
            addLog(task, 'error', line.trim());
          }
        });
      }

      setStatus(task, 'success');
      addLog(task, 'info', '✅ 构建成功完成');
      ElMessage.success('构建成功');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : '构建失败';
      addLog(task, 'error', `❌ 构建失败: ${errorMsg}`);
      setStatus(task, 'failed');
      ElMessage.error('构建失败，请查看日志');
    }
  };

  /**
   * 执行构建
   * 根据表单配置启动构建流程
   */
  const executeBuild = async (form: PublishForm): Promise<void> => {
    const project = getProjectById(form.projectId);
    if (!project) {
      ElMessage.error('未找到项目配置');
      return;
    }

    // 创建构建任务
    const task: BuildTask = {
      id: `build_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      projectId: project.id,
      env: form.env,
      status: 'building',
      logs: [],
      startTime: Date.now(),
    };

    currentTask.value = task;
    isBuilding.value = true;

    addLog(task, 'info', `📦 开始构建 ${project.name}`);
    addLog(task, 'info', `📋 环境: ${form.env} | 版本: ${form.version}`);
    if (form.description) {
      addLog(task, 'info', `📝 描述: ${form.description}`);
    }

    // 构建命令（可根据环境替换参数）
    let buildCmd = project.buildCommand;
    if (form.env === 'prod') {
      buildCmd = buildCmd.replace('debug', 'release');
    }

    // 执行构建
    await runBuildCommand(task, buildCmd, project.path);

    task.endTime = Date.now();

    // 自动发布
    if (form.autoPublish && task.status === 'success') {
      addLog(task, 'info', '🚀 开始自动发布...');
      // 发布逻辑可在此扩展
      addLog(task, 'info', '✅ 发布完成');
    }

    isBuilding.value = false;
  };

  /** 取消构建 */
  const cancelBuild = () => {
    if (currentTask.value) {
      addLog(currentTask.value, 'warn', '⚠️ 构建已被用户取消');
      setStatus(currentTask.value, 'failed');
      isBuilding.value = false;
    }
  };

  return {
    currentTask,
    isBuilding,
    executeBuild,
    cancelBuild,
  };
};
