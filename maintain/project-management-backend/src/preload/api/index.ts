/**
 * @file preload api 统一出口
 */
import { electronAPI } from '@electron-toolkit/preload'
import { addListener, removeListener } from '@preload/api/utils/handler'
import { releaseApi } from '@preload/api/releaseApi'
import type { ElectronApi } from '@preload/api/types/api'

/**
 * electronApi
 */
export const electronApi: ElectronApi = {
  /** 页面渲染控制能力 */
  webFrame: electronAPI.webFrame,
  /** 文件等 web 工具能力 */
  webUtils: electronAPI.webUtils,
  /** 进程信息 */
  process: electronAPI.process,
  /** 订阅主进程推送消息 */
  addListener,
  /** 取消订阅（须传入与 addListener 相同的回调引用） */
  removeListener,
  /** 发布api */
  release: releaseApi
}
