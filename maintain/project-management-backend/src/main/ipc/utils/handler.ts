/**
 * @file IPC 处理封装
 */
import { ipcMain } from 'electron'
import type { IpcMainEvent, IpcMainInvokeEvent, WebContents } from 'electron'
import type {
  IpcApiChannel,
  IpcApiChannelArgs,
  IpcApiChannelResult,
  IpcMsgChannel,
  IpcMsgPayload
} from '@main/ipc/types/Ipc'

/**
 * ipc handle
 * @param channel 通道名
 * @param listener 处理回调
 */
export function handle<C extends IpcApiChannel>(
  channel: C,
  listener: (
    event: IpcMainInvokeEvent,
    ...args: IpcApiChannelArgs<C>
  ) => IpcApiChannelResult<C> | Promise<IpcApiChannelResult<C>>
): void {
  ipcMain.handle(channel, listener)
}

/**
 * ipc on
 * @param channel 通道名
 * @param listener 处理回调
 */
export function on<C extends IpcApiChannel>(
  channel: C,
  listener: (event: IpcMainEvent, ...args: IpcApiChannelArgs<C>) => void
): void {
  ipcMain.on(channel, listener)
}

/**
 * ipc send：主进程推送消息给 web
 * @param webContents 目标渲染进程的 webContents
 * @param channel 推送通道名（须在 IpcMsg 契约中登记）
 * @param payload 推送负载（元组展开）
 */
export function send<C extends IpcMsgChannel>(
  webContents: WebContents,
  channel: C,
  ...payload: IpcMsgPayload<C>
): void {
  webContents.send(channel, ...(payload as unknown[]))
}
