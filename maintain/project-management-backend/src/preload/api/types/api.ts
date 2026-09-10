/**
 * @file 渲染进程 api 类型集合
 * @description 定义暴露给渲染进程的 electron api 结构
 */
import type { WebFrame, WebUtils } from 'electron'
import type { TIpcMsgChannel } from '@shared/types/ipc'
import type { IpcApiShape, IpcMsgListener } from '@preload/api/types/ipc'

/**
 * electron api
 */
export type ElectronApi = IpcApiShape & {
  /** 页面渲染控制能力 */
  webFrame: WebFrame
  /** 文件等 web 工具能力 */
  webUtils: WebUtils
  /** 订阅主进程推送消息 */
  addListener: <C extends TIpcMsgChannel>(channel: C, listener: IpcMsgListener<C>) => void
  /** 取消订阅（须传入与 addListener 相同的回调引用） */
  removeListener: <C extends TIpcMsgChannel>(channel: C, listener: IpcMsgListener<C>) => void
}
