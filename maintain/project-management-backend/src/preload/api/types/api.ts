/**
 * @file api-类型（所有 api 集合）
 */
import type { NodeProcess, WebFrame, WebUtils } from '@electron-toolkit/preload'
import type { IpcMsgChannel } from '@main/ipc/types/Ipc'
import type { IpcApiShape, IpcMsgListener } from '@preload/api/types/ipc'

/**
 * electron api
 */
export type ElectronApi = IpcApiShape & {
  /** 页面渲染控制能力 */
  webFrame: WebFrame
  /** 文件等 web 工具能力 */
  webUtils: WebUtils
  /** 进程信息 */
  process: NodeProcess
  /** 订阅主进程推送消息 */
  addListener: <C extends IpcMsgChannel>(channel: C, listener: IpcMsgListener<C>) => void
  /** 取消订阅（须传入与 addListener 相同的回调引用） */
  removeListener: <C extends IpcMsgChannel>(channel: C, listener: IpcMsgListener<C>) => void
}
