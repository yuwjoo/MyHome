/**
 * NativeBridge 全局配置常量
 */

export const NATIVE_HOST = '__nativeHost' // 原生端挂载在 window 上的对象名 { platform, call }
export const WEB_BRIDGE = '__webBridge' // Web 端挂载在 window 上的回调注册中心名
export const LISTENER_GROUP = '__listeners' // on() 监听的默认消息组名
export const DEFAULT_TIMEOUT = 60 // send() 默认超时秒数
export const TIMEOUT_MESSAGE = 'timeout' // 超时错误消息
