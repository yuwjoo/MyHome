import type {
  BridgeChannelDone,
  BridgeChannelEmit,
  BridgeChannelOff,
  BridgeChannelOn,
  BridgeChannelOnly,
  BridgeChannelSend,
  Callback
} from "./types/bridgeChannel";
import { generateId } from "./utils";
import { triggerEvent } from "./webViewInterface";

export const channelMap: Map<string, BridgeChannel> = new Map(); // 通道map

export class BridgeChannel {
  private readonly events: Map<string, Set<Callback>> = new Map(); // 监听事件map
  public readonly id: string; // 通道id

  constructor(id: string = generateId()) {
    this.id = id;
    channelMap.set(this.id, this);
  }

  /**
   * @description: 监听事件
   */
  public readonly on: BridgeChannelOn = (eventName, callback) => {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, new Set());
    }
    this.events.get(eventName)!.add(callback);
  };

  /**
   * @description: 监听一次性事件
   */
  public readonly only: BridgeChannelOnly = (eventName, callback) => {
    const onceWrapper = (payload: string) => {
      callback(payload);
      this.off(eventName, onceWrapper);
    };
    this.on(eventName, onceWrapper);
  };

  /**
   * @description: 取消事件
   */
  public readonly off: BridgeChannelOff = (eventName, callback) => {
    const callbacks = this.events.get(eventName);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.events.delete(eventName);
      }
    }
  };

  /**
   * @description: 触发内部事件
   */
  public readonly emit: BridgeChannelEmit = (eventName, payload) => {
    const callbacks = this.events.get(eventName);
    if (callbacks) {
      callbacks.forEach((cb) => cb(payload));
    }
  };

  /**
   * @description: 发送事件
   */
  public readonly send: BridgeChannelSend = (eventName, payload) => {
    triggerEvent({ channelId: this.id, eventName, payload, isDone: false });
  };

  /**
   * @description: 发送结束事件
   */
  public readonly done: BridgeChannelDone = (eventName, payload) => {
    triggerEvent({ channelId: this.id, eventName, payload, isDone: true });
    this.close();
  };

  /**
   * @description: 关闭通道
   */
  public readonly close = () => {
    this.events.clear();
    channelMap.delete(this.id);
  };
}
