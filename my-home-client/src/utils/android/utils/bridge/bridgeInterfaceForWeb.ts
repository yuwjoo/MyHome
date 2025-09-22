import type { WebTriggerEventOptions } from "../../types/bridge/bridgeInterfaceForWeb";
import { channelStore } from "./channelStore";
import { bridgeConfig } from "./bridgeConfig";

class BridgeInterfaceForWeb {
  constructor() {
    window[bridgeConfig.WEB_INTERFACE_KEY] = this; // 挂载web接口对象
  }

  /**
   * @description: 触发事件
   * @param {WebTriggerEventOptions} options 选项
   */
  public triggerEvent(options: WebTriggerEventOptions) {
    const channel = channelStore.get(options.id);
    if (channel === undefined) return;
    if (options.name) {
      channel.emit(options.name, options.data);
    }
    if (options.isDone) {
      channel.emit(
        options.isReject ? bridgeConfig.REJECT_CALLBACK_KEY : bridgeConfig.RESOLVE_CALLBACK_KEY,
        options.data
      );
      channel.close();
    }
  }

  /**
   * @description: 抛出异常
   * @param {string} message 消息
   */
  public throwError(message: string) {
    console.error(message);
  }
}

export const bridgeInterfaceForWeb = new BridgeInterfaceForWeb();
