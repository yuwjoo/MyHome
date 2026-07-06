/**
 * 消息接收器（渲染进程）
 * 通过 preload 注入的 messageReceiver 对象监听主进程消息
 * 收到消息后查找回调中心并触发，支持 isEnd 标识自动清理
 *
 * 对应 web 端 MessageReceiver
 */
import { callbackCenter } from './callbackCenter';
import { bridgeConfig } from './bridgeConfig';
import type { ReceivedMessage } from './types/bridge';

export class MessageReceiver {
  constructor() {
    // 通过 preload 注入的 messageReceiver 注册 IPC 消息监听
    // preload 在独立上下文中监听 IPC，再转发到渲染进程的 onMessage
    const receiver = (window as any)[bridgeConfig.messageReceiverKey];
    if (typeof receiver?.onMessage === 'function') {
      receiver.onMessage((msg: ReceivedMessage) => this.onMessage(msg));
    }
  }

  /**
   * 处理主进程回传的消息
   */
  onMessage(msg: ReceivedMessage): void {
    const { groupName, messageId, callbackName, data, isEnd, isRetained } = msg;

    // 触发对应的回调
    callbackCenter.trigger(groupName, messageId, callbackName, data, isRetained);

    // 结束标识：清除该消息对应的所有回调
    if (isEnd) {
      callbackCenter.removeAllByMessage(groupName, messageId);
    }
  }
}

/** 单例导出 */
export const messageReceiver = new MessageReceiver();
