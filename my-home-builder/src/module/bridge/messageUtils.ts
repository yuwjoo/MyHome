/**
 * 消息工具类
 * 封装 send / on / off 操作
 * 先记录回调到 CallbackCenter，再通过 NativeProvider 通知主进程
 *
 * 对应 web 端 MessageUtils，去掉了强类型泛型约束（由使用方自行保证类型安全）
 */
import { v4 as uuid } from 'uuid';
import { callbackCenter } from './callbackCenter';
import { nativeProvider } from './nativeProvider';
import type { Callback } from './types/bridge';

class MessageUtils {
  /**
   * 发送消息到主进程
   *
   * @param groupName   分组名称
   * @param messageName 消息名称
   * @param params      消息参数（可选）
   * @param callbacks   回调映射（可选，如 { onSuccess, onError }）
   */
  send(
    groupName: string,
    messageName: string,
    params?: Record<string, unknown>,
    callbacks?: Record<string, Callback>,
  ): void {
    if (!nativeProvider.isNativeEnv()) return;

    const messageId = uuid();

    if (callbacks) {
      for (const [callbackName, handler] of Object.entries<Callback>(callbacks)) {
        callbackCenter.register(groupName, messageId, callbackName, handler);
      }
    }

    nativeProvider.send(groupName, messageName, messageId, params ?? {});
  }

  /**
   * 监听主进程事件
   *
   * @param groupName   分组名称
   * @param eventName   事件名称
   * @param handler     事件回调
   */
  on(groupName: string, eventName: string, handler: Callback): void {
    if (!nativeProvider.isNativeEnv()) return;

    const messageId = eventName;
    const callbackName = 'onMessage';
    const alreadyListening = callbackCenter.hasHandler(groupName, messageId, callbackName);

    callbackCenter.register(groupName, messageId, callbackName, handler);

    if (alreadyListening) {
      const lastResponse = callbackCenter.getLastResponse(groupName, messageId, callbackName);
      if (lastResponse !== undefined) handler(lastResponse);
    } else {
      nativeProvider.send(groupName, eventName, messageId, { action: 'on' });
    }
  }

  /**
   * 取消监听主进程事件
   *
   * @param groupName   分组名称
   * @param eventName   事件名称
   * @param handler     要移除的回调，不传则移除该事件下所有回调
   */
  off(groupName: string, eventName: string, handler?: Callback): void {
    if (!nativeProvider.isNativeEnv()) return;

    const messageId = eventName;
    const callbackName = 'onMessage';
    const stillListening = callbackCenter.hasHandler(groupName, messageId, callbackName);

    callbackCenter.remove(groupName, messageId, callbackName, handler);

    if (!stillListening) {
      nativeProvider.send(groupName, eventName, messageId, { action: 'off' });
    }
  }
}

/** 单例导出 */
export const messageUtils = new MessageUtils();
