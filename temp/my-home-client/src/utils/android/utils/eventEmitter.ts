import type { EventCallback } from "../types/eventEmitter";

export class EventEmitter<TEvents extends Record<any, any[]> = Record<any, any[]>> {
  protected events: Map<keyof TEvents, Set<EventCallback<any[]>>> = new Map();

  /**
   * @description: 监听事件
   * @param {TEventName} eventName 事件名称
   * @param {EventCallback<TEvents[TEventName]>} callback 回调函数
   */
  public on<TEventName extends keyof TEvents>(
    eventName: TEventName,
    callback: EventCallback<TEvents[TEventName]>
  ): void {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, new Set());
    }
    this.events.get(eventName)!.add(callback);
  }

  /**
   * @description: 取消监听
   * @param {TEventName} eventName 事件名称
   * @param {EventCallback<TEvents[TEventName]>} callback 回调函数
   */
  public off<TEventName extends keyof TEvents>(
    eventName: TEventName,
    callback: EventCallback<TEvents[TEventName]>
  ): void {
    const callbacks = this.events.get(eventName);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.events.delete(eventName);
      }
    }
  }

  /**
   * @description: 一次性监听
   * @param {TEventName} eventName 事件名称
   * @param {EventCallback<TEvents[TEventName]>} callback 回调函数
   */
  public only<TEventName extends keyof TEvents>(
    eventName: TEventName,
    callback: EventCallback<TEvents[TEventName]>
  ): void {
    const onceWrapper = (...arg: TEvents[TEventName]) => {
      callback(...arg);
      this.off(eventName, onceWrapper);
    };
    this.on(eventName, onceWrapper);
  }

  /**
   * @description: 触发事件
   * @param {TEventName} eventName 事件名称
   * @param {TEvents[TEventName]} arg 调用参数
   */
  public emit<TEventName extends keyof TEvents>(eventName: TEventName, ...arg: TEvents[TEventName]): void {
    const callbacks = this.events.get(eventName);
    if (callbacks) {
      callbacks.forEach((cb) => cb(...arg));
    }
  }
}
