/**
 * @file IPC 通道处理封装
 * @description 统一约束 IPC 通道名、参数与返回值类型，提供通道注册与消息发送能力
 */
import { ipcMain } from 'electron'
import type { IpcMainEvent, IpcMainInvokeEvent, WebContents } from 'electron'
import type {
  TIpcApiChannel,
  TIpcApiChannelArgs,
  TIpcApiChannelResult,
  TIpcMsgChannel,
  TIpcMsgPayload
} from '@shared/types/ipc'

/**
 * 注册请求-响应通道
 * @param channel 通道名
 * @param listener 处理回调
 */
export function handle<C extends TIpcApiChannel>(
  channel: C,
  listener: (
    event: IpcMainInvokeEvent,
    ...args: TIpcApiChannelArgs<C>
  ) => TIpcApiChannelResult<C> | Promise<TIpcApiChannelResult<C>>
): void {
  ipcMain.handle(channel, listener)
}

/**
 * 注册单向通知通道
 * @param channel 通道名
 * @param listener 处理回调
 */
export function on<C extends TIpcApiChannel>(
  channel: C,
  listener: (event: IpcMainEvent, ...args: TIpcApiChannelArgs<C>) => void
): void {
  ipcMain.on(channel, listener)
}

/**
 * 主进程向渲染进程推送消息
 * @param webContents 目标渲染进程的 webContents
 * @param channel 推送通道名（须在 TIpcMsg 契约中登记）
 * @param payload 推送负载（元组展开）
 */
export function send<C extends TIpcMsgChannel>(
  webContents: WebContents,
  channel: C,
  ...payload: TIpcMsgPayload<C>
): void {
  webContents.send(channel, ...(payload as unknown[]))
}
