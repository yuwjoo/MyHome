/**
 * 消息分发器（主进程）
 * 注册分组实例，分发消息到对应的处理方法
 *
 * 对应 Android 端 Dispatcher，但用 register-by-name 替代反射扫描注解
 */
import type { BrowserWindow } from 'electron';
import { MessageSender } from './messageSender';
import type { NativeMessage } from './types';

/** 消息处理函数签名 */
export type MessageHandler = (params: Record<string, unknown>, sender: MessageSender) => void;

/** 分组实例接口：提供 groupName 和消息处理函数映射 */
export interface BridgeGroup {
  /** 分组名称 */
  readonly groupName: string;
  /** 消息名 → 处理函数的映射 */
  readonly messages: Record<string, MessageHandler>;
}

export class Dispatcher {
  // groupName → (messageName → handler)
  private readonly routes: Map<string, Map<string, MessageHandler>> = new Map();

  /**
   * 注册分组实例
   */
  register(group: BridgeGroup): void {
    const messageMap = this.routes.get(group.groupName) ?? new Map();
    for (const [messageName, handler] of Object.entries(group.messages)) {
      messageMap.set(messageName, handler);
    }
    this.routes.set(group.groupName, messageMap);
  }

  /**
   * 分发消息到对应的处理方法
   */
  dispatch(browserWindow: BrowserWindow, msg: NativeMessage): void {
    const { groupName, messageName, messageId, params } = msg;

    const messageMap = this.routes.get(groupName);
    if (!messageMap) {
      console.warn(`[Dispatcher] 未找到分组 "${groupName}"`);
      return;
    }

    const handler = messageMap.get(messageName);
    if (!handler) {
      console.warn(`[Dispatcher] 分组 "${groupName}" 中未找到消息 "${messageName}"`);
      return;
    }

    const sender = new MessageSender(browserWindow, groupName, messageId);

    try {
      handler(params, sender);
    } catch (error) {
      console.error(`[Dispatcher] 处理消息异常: ${groupName}.${messageName}`, error);
    }
  }
}
