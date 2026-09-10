/**
 * @file 预加载脚本入口
 * @description 上下文隔离开启时通过 contextBridge 将 electronApi 暴露到渲染进程 window
 */
import { contextBridge } from 'electron'
import { electronApi } from '@preload/api'

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electronApi', electronApi)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electronApi = electronApi
}
