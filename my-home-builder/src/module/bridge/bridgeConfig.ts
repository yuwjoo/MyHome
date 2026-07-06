/**
 * 渲染进程 Bridge 配置
 * 与主进程 bridgeConfig 保持一致
 */
export const bridgeConfig = {
  // native provider 在 window 上的挂载 key
  nativeProviderKey: '__bridge:native-provider__',
  // 消息接收器在 window 上的挂载 key
  messageReceiverKey: '__bridge:message-receiver__',
} as const;
