/**
 * 回调注册中心，挂载于 window.__webBridge
 *
 * 存储结构：{ 消息组: { 事件名: [回调函数] } }
 */
import { v4 as uuidV4 } from 'uuid'
import type { SendCallbacks, EventHandler, NativeError } from '../types'
import { LISTENER_GROUP, DEFAULT_TIMEOUT, TIMEOUT_MESSAGE } from '../config'

type CallbackStore = Record<string, Record<string, EventHandler[]>>

export class CallbackRegistry {
  private _store: CallbackStore = {} // 回调存储 { 消息组: { 事件名: [回调函数] } }
  private _timers: Map<string, ReturnType<typeof setTimeout>> = new Map() // 超时定时器 { 消息组: timer }

  /**
   * 注册回调对象，返回 UUID 作为消息组 ID
   */
  register(callbacks: SendCallbacks, timeout?: number): string {
    const groupId = uuidV4()
    const effectiveTimeout = timeout ?? DEFAULT_TIMEOUT

    this._store[groupId] = {}
    for (const [name, fn] of Object.entries(callbacks)) {
      if (!this._store[groupId][name]) {
        this._store[groupId][name] = []
      }
      this._store[groupId][name].push(fn as EventHandler)
    }

    if (effectiveTimeout > 0) {
      const timer = setTimeout(() => {
        const errorData: NativeError = { code: -1, message: TIMEOUT_MESSAGE, timeout: true }
        this.invoke(groupId, 'onError', errorData)
        this.removeGroup(groupId)
      }, effectiveTimeout * 1000)
      this._timers.set(groupId, timer)
    }

    return groupId
  }

  /**
   * 添加监听函数到 __listeners 消息组
   */
  addListener(name: string, handler: EventHandler): void {
    if (!this._store[LISTENER_GROUP]) {
      this._store[LISTENER_GROUP] = {}
    }
    if (!this._store[LISTENER_GROUP][name]) {
      this._store[LISTENER_GROUP][name] = []
    }
    this._store[LISTENER_GROUP][name].push(handler)
  }

  /**
   * 移除监听；不传 handler 则清空该事件名下所有函数
   */
  removeListener(name: string, handler?: EventHandler): void {
    const group = this._store[LISTENER_GROUP]
    if (!group) return

    if (!handler) {
      delete group[name]
      return
    }

    const handlers = group[name]
    if (!handlers) return
    const idx = handlers.indexOf(handler)
    if (idx > -1) handlers.splice(idx, 1)
    if (handlers.length === 0) delete group[name]
  }

  /**
   * 原生端触发回调的唯一入口
   */
  invoke(groupId: string, eventName: string, data: unknown): void {
    // 非超时回调时清除定时器
    if (eventName !== 'onError' && this._timers.has(groupId)) {
      clearTimeout(this._timers.get(groupId))
      this._timers.delete(groupId)
    }

    const handlers = this._store[groupId]?.[eventName]
    if (!handlers) return
    // 复制数组避免遍历期间回调内部调用 removeGroup 导致问题
    const snapshot = [...handlers]
    for (const fn of snapshot) {
      try {
        fn(data)
      } catch (e) {
        console.error(`[CallbackRegistry] invoke error (groupId=${groupId}, eventName=${eventName}):`, e)
      }
    }
  }

  /**
   * 从 _store 删除整个消息组
   */
  removeGroup(groupId: string): void {
    delete this._store[groupId]
    const timer = this._timers.get(groupId)
    if (timer) {
      clearTimeout(timer)
      this._timers.delete(groupId)
    }
  }
}
