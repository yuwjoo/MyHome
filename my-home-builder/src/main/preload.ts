/**
 * Preload 脚本
 * 通过 contextBridge 向渲染进程暴露安全的 Node.js API
 * 注意：仅暴露最小必要接口，保证安全性
 */

import { contextBridge, ipcRenderer } from 'electron';
import { bridgeConfig } from './module/bridge/bridgeConfig';

// ============================================================
// Bridge 注入：主进程 ↔ 渲染进程 双向消息通道
// ============================================================

// 渲染进程 → 主进程方向
contextBridge.exposeInMainWorld(bridgeConfig.nativeProviderKey, {
  /** 获取当前平台标识 */
  platform: () => process.platform,

  /** 渲染进程 → 主进程：发送消息 */
  onMessage: (json: string) => {
    ipcRenderer.invoke(bridgeConfig.onMessageIPCEvent, JSON.parse(json));
  },
});

// 主进程 → 渲染进程方向
// 由渲染进程 MessageReceiver 调用 onMessage 注册接收回调
contextBridge.exposeInMainWorld(bridgeConfig.messageReceiverKey, {
  onMessage: (handler: (msg: unknown) => void) => {
    ipcRenderer.on(bridgeConfig.sendMessageIPCEvent, (_event, msg) => handler(msg));
  },
});

/** 暴露给渲染进程的 API */
contextBridge.exposeInMainWorld('electronAPI', {
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
   * 写入文件内容
   * @param filePath - 文件路径
   * @param content - 文件内容
   */
  writeFile: (filePath: string, content: string): Promise<void> => {
    return ipcRenderer.invoke('write-file', filePath, content);
  },
});
