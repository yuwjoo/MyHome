import { channelMap } from "./bridgeChannel";
import { bridgeConfig } from "./bridgeConfig";
import type { WebInterfaceTriggerEventOptions } from "./types/webInterface";

/**
 * @description: 触发事件
 * @param {WebInterfaceTriggerEventOptions} options 发送数据
 */
function triggerEvent(options: WebInterfaceTriggerEventOptions) {
  const channel = channelMap.get(options.channelId);
  if (channel === undefined) return;
  if (options.eventName) {
    channel.emit(options.eventName, options.payload);
  }
  if (options.isDone) {
    channel.emit(options.isError ? bridgeConfig.rejectCallbackKey : bridgeConfig.resolveCallbackKey, options.payload);
    channel.close();
  }
}

/**
 * @description: 抛出异常
 * @param {string} message 消息
 */
function throwError(message: string) {
  console.error(message);
}

/**
 * @description: 挂载web接口对象
 */
export function mountWebInterface() {
  window[bridgeConfig.webInterfaceKey] = {
    triggerEvent,
    throwError
  };
}
