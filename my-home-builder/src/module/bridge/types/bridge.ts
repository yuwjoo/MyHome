/**
 * 渲染进程 Bridge 类型定义
 * 与 web 端 bridge 类型保持一致
 */
import { bridgeConfig } from '../bridgeConfig';

/** 回调函数类型 */
export type Callback = (...args: any[]) => void;

/** 原生端平台标识 */
export type NativePlatform = 'win32' | 'darwin' | 'linux';

/** 原生端挂载在 window 上的 bridge 结构 */
export interface NativeProviderObject {
  platform(): NativePlatform;
  onMessage(json: string): void;
}

/** 发送到主进程的消息体 */
export interface NativeMessage {
  groupName: string;
  messageName: string;
  messageId: string;
  params: Record<string, unknown>;
}

/** 主进程回传给渲染进程的消息体 */
export interface ReceivedMessage {
  groupName: string;
  messageId: string;
  callbackName: string;
  data?: unknown;
  isEnd?: boolean;
  isRetained?: boolean;
}

declare global {
  interface Window {
    [bridgeConfig.nativeProviderKey]?: NativeProviderObject;
  }
}
