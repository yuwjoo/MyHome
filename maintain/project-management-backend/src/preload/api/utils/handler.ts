/**
 * @file 渲染进程 IPC 调用、通知与订阅封装
 */
import { ipcRenderer } from 'electron'
import type {
  IpcApiChannel,
  IpcApiChannelArgs,
  IpcApiChannelResult,
  IpcMsgChannel
} from '@main/ipc/types/Ipc'
import type { IpcMsgListener } from '@preload/api/types/ipc'

/**
 * ipc invoke：渲染进程调用主进程通道
 * @param channel 通道名（须在 IpcApi 契约中登记）
 * @param args 通道参数（元组展开）
 * @returns 主进程处理结果
 */
export function invoke<C extends IpcApiChannel>(
  channel: C,
  ...args: IpcApiChannelArgs<C>
): Promise<IpcApiChannelResult<C>> {
  return ipcRenderer.invoke(channel, ...(args as unknown[])) as Promise<IpcApiChannelResult<C>>
}

/**
 * ipc send：渲染进程单向通知主进程（与主进程 ipcMain.on 配对，无返回值）
 * @param channel 通道名（须在 IpcApi 契约中登记）
 * @param args 通道参数（元组展开）
 */
export function send<C extends IpcApiChannel>(channel: C, ...args: IpcApiChannelArgs<C>): void {
  ipcRenderer.send(channel, ...(args as unknown[]))
}

/**
 * ipc addListener：渲染进程订阅主进程推送消息
 * @param channel 通道名（须在 IpcMsg 契约中登记）
 * @param listener 推送回调（事件 + 负载）
 */
export function addListener<C extends IpcMsgChannel>(
  channel: C,
  listener: IpcMsgListener<C>
): void {
  ipcRenderer.on(channel, listener)
}

/**
 * ipc removeListener：取消订阅（须传入与 addListener 相同的回调引用）
 * @param channel 通道名
 * @param listener 注册时的同一回调
 */
export function removeListener<C extends IpcMsgChannel>(
  channel: C,
  listener: IpcMsgListener<C>
): void {
  ipcRenderer.removeListener(channel, listener)
}
