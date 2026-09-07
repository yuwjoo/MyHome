/**
 * @file IPC 处理封装
 */
import { ipcMain } from 'electron'
import type { IpcMainEvent, IpcMainInvokeEvent } from 'electron'
import type { IpcApiChannel, IpcApiChannelArgs, IpcApiChannelResult } from '../types/Ipc'

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
