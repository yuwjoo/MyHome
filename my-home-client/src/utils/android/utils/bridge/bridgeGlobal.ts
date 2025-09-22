import type { BridgeGlobalOn, BridgeGlobalSend } from "../../types/bridge/bridgeGlobal";
import { bridgeInterfaceForAndroid } from "./bridgeInterfaceForAndroid";
import { Channel } from "./channel";
import { channelStore } from "./channelStore";
import { bridgeConfig } from "./bridgeConfig";

class BridgeGlobal {
  private globalEventChannel: Channel; // 全局事件通道

  constructor() {
    this.globalEventChannel = new Channel({ id: bridgeConfig.GLOBAL_EVENT_CHANNEL_ID });
    channelStore.add(this.globalEventChannel);
  }

  /**
   * @description: 监听事件
   */
  public readonly on: BridgeGlobalOn = (name, callback) => {
    this.globalEventChannel.on(name, callback);
  };

  /**
   * @description: 监听一次性事件
   */
  public readonly only: BridgeGlobalOn = (name, callback) => {
    this.globalEventChannel.only(name, callback);
  };

  /**
   * @description: 关闭事件
   */
  public readonly off: BridgeGlobalOn = (name, callback) => {
    this.globalEventChannel.off(name, callback);
  };

  /**
   * @description: 发送事件
   */
  public readonly send: BridgeGlobalSend = (name, data) => {
    bridgeInterfaceForAndroid.triggerEvent({ id: bridgeConfig.GLOBAL_EVENT_CHANNEL_ID, name, data });
  };
}

export const bridgeGlobal = new BridgeGlobal();
