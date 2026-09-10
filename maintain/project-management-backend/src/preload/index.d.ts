/**
 * @file 预加载脚本全局类型
 * @description 声明 preload 注入到渲染进程 window 上的 electronApi 类型
 */
import type { ElectronApi } from '@preload/api/types/api'

declare global {
  interface Window {
    electronApi: ElectronApi
  }
}
