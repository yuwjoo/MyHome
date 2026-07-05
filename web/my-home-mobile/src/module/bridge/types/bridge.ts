import { bridgeConfig } from '../bridgeConfig'
import type { MessageReceiver } from '../messageReceiver'

// 回调函数类型
export type Callback = (...args: any[]) => void

// 原生端平台标识
export type NativePlatform = 'android' | 'harmony'

// 原生端挂载在 window 上的 bridge 结构
export interface NativeProviderObject {
  platform(): NativePlatform // 获取当前平台标识
  onMessage(json: string): void // 接收来自 web 端发送的消息
}

// 发送到原生端的消息体
export interface NativeMessage {
  groupName: string // 分组名称
  messageName: string // 消息名称
  messageId: string // 消息唯一 ID
  params: Record<string, unknown> // 消息参数
}

// 原生端调用 onMessage 时传入的 JSON 结构
export interface ReceivedMessage {
  groupName: string // 分组名称
  messageId: string // 消息唯一 ID
  callbackName: string // 回调名称
  data?: unknown // 回传数据
  isEnd?: boolean // 是否标记消息结束，清除该消息所有回调
  isRetained?: boolean // 是否保留数据，为 true 时存储最后一次数据供后续使用
}

declare global {
  interface Window {
    [bridgeConfig.nativeProviderKey]?: NativeProviderObject // 原生端注入的 provider 对象
    [bridgeConfig.messageReceiverKey]: MessageReceiver // 原生消息接收器
  }
}
