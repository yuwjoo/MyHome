import type { Callback } from './types/bridge'

// 回调存储条目
type CallbackEntry = { fun: Callback; response: any }

// 回调存储结构: { 分组名称: { 消息id: { 回调名称: [回调条目, ...] } } }
type CallbackStore = Record<string, Record<string, Record<string, CallbackEntry[]>>>

/**
 * 回调中心，管理分组级消息回调的注册、移除与通知
 */
class CallbackCenter {
  private store: CallbackStore = {}

  /**
   * 注册回调
   *
   * @param groupName    分组名称
   * @param messageId    消息 ID
   * @param callbackName 回调名称
   * @param handler      回调函数
   */
  register(groupName: string, messageId: string, callbackName: string, handler: Callback): void {
    if (!this.store[groupName]) {
      this.store[groupName] = {}
    }
    const groupStore = this.store[groupName]
    if (!groupStore[messageId]) {
      groupStore[messageId] = {}
    }
    const messageStore = groupStore[messageId]
    if (!messageStore[callbackName]) {
      messageStore[callbackName] = []
    }
    messageStore[callbackName].push({ fun: handler, response: undefined })
  }

  /**
   * 移除回调
   *
   * @param groupName    分组名称
   * @param messageId    消息 ID
   * @param callbackName 回调名称
   * @param handler      要移除的回调，不传则移除该回调名下所有条目
   */
  remove(groupName: string, messageId: string, callbackName: string, handler?: Callback): void {
    const groupStore = this.store[groupName]
    if (!groupStore) return

    const messageStore = groupStore[messageId]
    if (!messageStore) return

    const entries = messageStore[callbackName]
    if (!entries) return

    if (handler) {
      messageStore[callbackName] = entries.filter((e) => e.fun !== handler)
    } else {
      delete messageStore[callbackName]
    }

    // 清理空的存储层级
    if (Object.keys(messageStore).length === 0) {
      delete groupStore[messageId]
    }
    if (Object.keys(groupStore).length === 0) {
      delete this.store[groupName]
    }
  }

  /**
   * 触发回调，调用该分组下某消息某回调名称的所有回调函数
   *
   * @param groupName    分组名称
   * @param messageId    消息 ID
   * @param callbackName 回调名称
   * @param data         回调数据
   * @param isRetained   是否保留数据，为 true 时存储供后续回调使用
   */
  trigger(groupName: string, messageId: string, callbackName: string, data: unknown, isRetained: boolean = false): void {
    const entries = this.store[groupName]?.[messageId]?.[callbackName]
    if (!entries) return
    entries.forEach((entry) => {
      entry.response = isRetained ? data : undefined
      entry.fun(data)
    })
  }

  /**
   * 清除某个消息 ID 下的所有回调
   *
   * @param groupName   分组名称
   * @param messageId   消息 ID
   */
  removeAllByMessage(groupName: string, messageId: string): void {
    const groupStore = this.store[groupName]
    if (!groupStore) return

    delete groupStore[messageId]

    if (Object.keys(groupStore).length === 0) {
      delete this.store[groupName]
    }
  }

  /**
   * 检查是否有回调存在
   *
   * @param groupName    分组名称
   * @param messageId    消息 ID
   * @param callbackName 回调名称
   */
  hasHandler(groupName: string, messageId: string, callbackName: string): boolean {
    const entries = this.store[groupName]?.[messageId]?.[callbackName]
    return Array.isArray(entries) && entries.length > 0
  }

  /**
   * 获取最后一次响应数据
   *
   * @param groupName    分组名称
   * @param messageId    消息 ID
   * @param callbackName 回调名称
   */
  getLastResponse(groupName: string, messageId: string, callbackName: string): any {
    const entries = this.store[groupName]?.[messageId]?.[callbackName]
    if (!entries || entries.length === 0) return undefined
    return entries[0]?.response
  }
}

// 单例导出
export const callbackCenter = new CallbackCenter()
