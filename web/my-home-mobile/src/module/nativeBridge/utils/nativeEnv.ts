/**
 * NativeBridge 工具函数
 */
import { NativeBridge } from '../core/NativeBridge'
import type { NativePlatform } from '../types'
import { NATIVE_HOST } from '../config'

let instance: NativeBridge | null = null // 全局单例实例

/**
 * 初始化 NativeBridge，应于 main.ts 中尽早调用
 */
export function initNativeBridge(): NativeBridge {
  if (!instance) {
    instance = new NativeBridge()
  }
  return instance
}

/**
 * 获取全局单例 NativeBridge
 *
 * 需先调用 initNativeBridge() 完成初始化
 */
export function getNativeBridge(): NativeBridge {
  if (!instance) {
    throw new Error('[NativeBridge] 尚未初始化，请先在 main.ts 中调用 initNativeBridge()')
  }
  return instance
}

/**
 * 判断当前是否运行在原生环境中
 */
export function isNativeEnv(): boolean {
  return typeof window[NATIVE_HOST]?.call === 'function'
}

/**
 * 获取当前原生平台
 */
export function getNativePlatform(): NativePlatform | null {
  const host = window[NATIVE_HOST]
  if (typeof host?.platform !== 'function') return null
  return host.platform() ?? null
}
