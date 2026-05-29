import type {
  IChannelSend,
  IChannelDone,
  IChannel,
  IChannelOn,
  IChannelEmit,
  IChannelOptions
} from "../../types/bridge/channel";
import { EventEmitter } from "../eventEmitter";
import { bridgeInterfaceForAndroid } from "./bridgeInterfaceForAndroid";

export class Channel<OnEvent extends Record<PropertyKey, any> = any, SendEvent extends Record<PropertyKey, any> = any>
  extends EventEmitter
  implements IChannel
{
  public readonly id: string; // 通道id
  public isClose: boolean; // 是否关闭
  private onClose: (() => void) | undefined; // 关闭回调

  constructor(options: IChannelOptions) {
    super();
    this.id = options.id;
    this.isClose = options.isClose || false;
    this.onClose = options.onClose;
  }

  /**
   * @description: 监听事件
   */
  public readonly on: IChannelOn<OnEvent> = (name, callback) => {
    if (this.isClose) return;
    super.on(name, callback);
  };

  /**
   * @description: 监听一次性事件
   */
  public readonly only: IChannelOn<OnEvent> = (name, callback) => {
    if (this.isClose) return;
    super.only(name, callback);
  };

  /**
   * @description: 关闭事件
   */
  public readonly off: IChannelOn<OnEvent> = (name, callback) => {
    if (this.isClose) return;
    super.off(name, callback);
  };

  /**
   * @description: 触发内部事件
   */
  public readonly emit: IChannelEmit<OnEvent> = (name, data) => {
    if (this.isClose) return;
    super.emit(name, data);
  };

  /**
   * @description: 发送事件
   */
  public readonly send: IChannelSend<SendEvent> = (name, data) => {
    if (this.isClose) return;
    bridgeInterfaceForAndroid.triggerEvent({ id: this.id, name, data });
  };

  /**
   * @description: 发送结束事件
   */
  public readonly done: IChannelDone<SendEvent> = (name, data) => {
    if (this.isClose) return;
    bridgeInterfaceForAndroid.triggerEvent({ id: this.id, name, data, isDone: true });
    this.close();
  };

  /**
   * @description: 关闭通道
   */
  public readonly close = () => {
    if (this.isClose) return;
    this.isClose = true;
    this.events.clear();
    this.onClose?.();
  };
}
