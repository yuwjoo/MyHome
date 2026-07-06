/**
 * 主进程 Bridge 配置
 */
export const bridgeConfig = {
  // native provider 在 window 上的挂载 key
  nativeProviderKey: "__bridge:native-provider__",
  // 消息接收器在 window 上的挂载 key
  messageReceiverKey: "__bridge:message-receiver__",
  // IPC 事件：渲染进程 → 主进程
  onMessageIPCEvent: "onMessageIPCEvent",
  // IPC 事件：主进程 → 渲染进程
  sendMessageIPCEvent: "sendMessageIPCEvent",
} as const;
