/**
 * @file preload api 统一出口
 * @description 聚合 electron 原生能力与各域 api，作为渲染进程访问主进程能力的统一入口
 */
import { webFrame, webUtils } from 'electron'
import { addListener, removeListener } from '@preload/api/utils/handler'
import { releaseApi } from '@preload/api/releaseApi'
import type { TElectronApi } from '@preload/api/types/api'

/**
 * electronApi
 * 沙箱模式下 preload 仅可访问 electron 白名单模块（webFrame/webUtils/ipcRenderer/contextBridge），
 * 因此不使用 @electron-toolkit/preload 封装，直接取 electron 原生实例。
 */
export const electronApi: TElectronApi = {
  // 页面渲染控制能力
  webFrame,
  // 文件等 web 工具能力
  webUtils,
  // 订阅主进程推送消息
  addListener,
  // 取消订阅（须传入与 addListener 相同的回调引用）
  removeListener,
  // 发布api
  release: releaseApi
}
