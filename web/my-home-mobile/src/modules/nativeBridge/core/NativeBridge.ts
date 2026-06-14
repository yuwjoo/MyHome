/**
 * 核心通信类，Web 端面向业务层的唯一入口
 */
import type { SendCallbacks, SendOptions, EventHandler, MessageBody, NativeHost } from '../types'
import { CallbackRegistry } from './CallbackRegistry'
import { NATIVE_HOST, WEB_BRIDGE } from '../config'

declare global {
  interface Window {
    [NATIVE_HOST]?: NativeHost
    [WEB_BRIDGE]?: CallbackRegistry
  }
}

export class NativeBridge {
  private _registry: CallbackRegistry // 回调注册中心实例

  constructor() {
    // 创建或复用 window 上的全局 CallbackRegistry
    const existing = window[WEB_BRIDGE]
    if (existing) {
      this._registry = existing
    } else {
      this._registry = new CallbackRegistry()
      window[WEB_BRIDGE] = this._registry
    }
  }

  /**
   * 向原生端发送消息
   */
  send(
    messageName: string,
    params: Record<string, unknown>,
    callbacks?: SendCallbacks,
    options?: SendOptions,
  ): void {
    const nativeHost = window[NATIVE_HOST]
    if (typeof nativeHost?.call !== 'function') {
      throw new Error('[NativeBridge] window.__nativeHost.call 不可用，请确保原生端已完成注入')
    }

    const body: MessageBody = { messageName, params }

    if (callbacks) {
      body.groupId = this._registry.register(callbacks, options?.timeout)
    }

    nativeHost.call(JSON.stringify(body))
  }

  /**
   * 监听原生端主动推送的事件，返回取消监听的函数
   */
  on(eventName: string, handler: EventHandler): () => void {
    this._registry.addListener(eventName, handler)
    return () => {
      this._registry.removeListener(eventName, handler)
    }
  }

  /**
   * 取消事件监听
   */
  off(eventName: string, handler?: EventHandler): void {
    this._registry.removeListener(eventName, handler)
  }
}
