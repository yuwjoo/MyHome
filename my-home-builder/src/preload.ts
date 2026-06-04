/**
 * Preload 脚本
 * 通过 contextBridge 向渲染进程暴露安全的 Node.js API
 * 注意：仅暴露最小必要接口，保证安全性
 */

import { contextBridge, ipcRenderer } from 'electron';

/** 暴露给渲染进程的 API */
contextBridge.exposeInMainWorld('electronAPI', {
  /**
   * 执行 Shell 命令
   * @param command - 要执行的命令
   * @param cwd - 工作目录（可选）
   * @returns 标准输出和错误输出
   */
  execCommand: (command: string, cwd?: string): Promise<{ stdout: string; stderr: string }> => {
    return ipcRenderer.invoke('exec-command', { command, cwd });
  },

  /**
   * 执行 Shell 命令（实时流式输出）
   * @param command - 要执行的命令
   * @param cwd - 工作目录
   * @param taskId - 任务标识，用于区分不同命令的输出流
   * @returns 进程退出码
   */
  spawnCommand: (command: string, cwd: string, taskId: string): Promise<{ code: number | null }> => {
    return ipcRenderer.invoke('spawn-command', { command, cwd, taskId });
  },

  /**
   * 监听命令实时输出
   * @param callback - 收到输出数据时的回调
   */
  onCommandOutput: (callback: (data: { taskId: string; type: 'stdout' | 'stderr'; data: string }) => void) => {
    ipcRenderer.on('command-output', (_event, data) => callback(data));
  },

  /**
   * 移除命令输出监听
   */
  removeCommandOutputListener: () => {
    ipcRenderer.removeAllListeners('command-output');
  },

  /**
   * 打开目录选择对话框
   * @returns 选中的目录路径，取消则返回 null
   */
  selectDirectory: (): Promise<string | null> => {
    return ipcRenderer.invoke('select-directory');
  },

  /**
   * 读取文件内容
   * @param filePath - 文件路径
   * @returns 文件内容
   */
  readFile: (filePath: string): Promise<string> => {
    return ipcRenderer.invoke('read-file', filePath);
  },

  /**
   * 写入文件内容
   * @param filePath - 文件路径
   * @param content - 文件内容
   */
  writeFile: (filePath: string, content: string): Promise<void> => {
    return ipcRenderer.invoke('write-file', filePath, content);
  },
});
