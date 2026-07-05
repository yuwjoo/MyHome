/**
 * NativeBridge 类型定义
 */

/** 原生端平台标识 */
export type NativePlatform = 'android' | 'harmony'

/** 原生端挂载在 window.__nativeHost 上的对象结构（通过 addJavascriptInterface 注入） */
export interface NativeHost {
  platform(): NativePlatform // 设备环境（@JavascriptInterface 方法）
  call(json: string): void // 原生通信函数（@JavascriptInterface 方法）
}

/** send() 方法的配置选项 */
export interface SendOptions {
  /** 超时秒数；设为 0 永不超时（不推荐） */
  timeout?: number
}

/** send() 方法的回调对象，属性名由调用方自定义 */
export type SendCallbacks = Record<string, (...args: any[]) => void>

/** 超时或业务错误的数据结构 */
export interface NativeError {
  code: number // 错误码，超时为 -1
  message: string // 错误消息，超时时值为 'timeout'
  timeout?: boolean // 超时标记（仅超时时存在，值为 true）
}

/** 发往原生端的消息体 */
export interface MessageBody {
  groupId?: string // 消息组 UUID（无 callbacks 参数时不传）
  messageName: string // 消息名称
  params: Record<string, unknown> // 消息参数
}

/** on() / off() 使用的监听函数签名 */
export type EventHandler = (data: unknown) => void
