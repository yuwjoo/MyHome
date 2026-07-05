import { callbackCenter } from './callbackCenter'
import { bridgeConfig } from './bridgeConfig'
import type { ReceivedMessage } from './types/bridge'

/**
 * 消息接收器，挂载于 window，供原生端通过 evaluateJavascript 调用，
 * 收到消息后查找回调中心并触发，支持销毁标识自动清理
 */
export class MessageReceiver {
  constructor() {
    window[bridgeConfig.messageReceiverKey] = this
  }

  /**
   * 处理原生端回传的消息
   *
   * @param json 原生端传入的 JSON 字符串
   */
  onMessage(json: string): void {
    let msg: ReceivedMessage
    try {
      msg = JSON.parse(json)
    } catch {
      console.error('[MessageReceiver] 消息解析失败', json)
      return
    }

    const { groupName, messageId, callbackName, data, isEnd, isRetained } = msg

    // 触发对应的回调
    callbackCenter.trigger(groupName, messageId, callbackName, data, isRetained)

    // 结束标识：清除该消息对应的所有回调
    if (isEnd) {
      callbackCenter.removeAllByMessage(groupName, messageId)
    }
  }
}

// 单例导出
export const messageReceiver = new MessageReceiver()
