/**
 * NativeBridge 模块 — 统一出口
 */

// 工具函数（主要入口）
export { initNativeBridge, getNativeBridge, isNativeEnv, getNativePlatform } from './utils/nativeEnv'

// 核心类（高级场景直接使用）
export { NativeBridge } from './core/NativeBridge'

// 配置常量
export { NATIVE_HOST, WEB_BRIDGE, LISTENER_GROUP, DEFAULT_TIMEOUT, TIMEOUT_MESSAGE } from './config'

// 类型
export type { NativePlatform, NativeHost, SendOptions, SendCallbacks, NativeError, MessageBody, EventHandler } from './types'
