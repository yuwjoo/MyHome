/**
 * @file IPC 统一出口
 */
import { WebContents } from 'electron'
import { IpcMsgChannel, IpcMsgPayload } from './types/Ipc'

import './releaseIpc'

/**
 * ipc send：主进程推送消息给 web
 * @param webContents 目标渲染进程的 webContents
 * @param channel 推送通道名（须在 IpcMsg 契约中登记）
 * @param payload 推送负载（元组展开）
 */
export function ipcSend<C extends IpcMsgChannel>(
  webContents: WebContents,
  channel: C,
  ...payload: IpcMsgPayload<C>
): void {
  webContents.send(channel, ...(payload as unknown[]))
}
