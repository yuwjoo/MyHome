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


