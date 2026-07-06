/**
 * 主进程 Bridge 类型定义
 */

/** 发送到主进程的消息体 */
export interface NativeMessage {
  groupName: string;
  messageName: string;
  messageId: string;
  params: Record<string, unknown>;
}

/** 主进程回传给渲染进程的消息体 */
export interface RendererMessage {
  groupName: string;
  messageId: string;
  callbackName: string;
  data?: unknown;
  isEnd?: boolean;
  isRetained?: boolean;
}
