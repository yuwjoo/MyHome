/**
 * @file 渲染进程 IPC 调用封装
 * @description 提供渲染进程侧的 IPC 调用、通知与订阅能力
 */
import { ipcRenderer } from 'electron'
import type {
  TIpcApiChannel,
  TIpcApiChannelArgs,
  TIpcApiChannelResult,
  TIpcMsgChannel
} from '@shared/types/ipc'
import type { TIpcMsgListener } from '@preload/api/types/ipc'

/**
 * ipc invoke：渲染进程调用主进程通道
 * @param channel 通道名（须在 TIpcApi 契约中登记）
 * @param args 通道参数（元组展开）
 * @returns 主进程处理结果
 */
export function invoke<C extends TIpcApiChannel>(
  channel: C,
  ...args: TIpcApiChannelArgs<C>
): Promise<TIpcApiChannelResult<C>> {
  return ipcRenderer.invoke(channel, ...(args as unknown[])) as Promise<TIpcApiChannelResult<C>>
}

/**
 * ipc send：渲染进程单向通知主进程（与主进程 ipcMain.on 配对，无返回值）
 * @param channel 通道名（须在 TIpcApi 契约中登记）
 * @param args 通道参数（元组展开）
 */
export function send<C extends TIpcApiChannel>(channel: C, ...args: TIpcApiChannelArgs<C>): void {
  ipcRenderer.send(channel, ...(args as unknown[]))
}

/**
 * ipc addListener：渲染进程订阅主进程推送消息
 * @param channel 通道名（须在 TIpcMsg 契约中登记）
 * @param listener 推送回调（事件 + 负载）
 */
export function addListener<C extends TIpcMsgChannel>(
  channel: C,
  listener: TIpcMsgListener<C>
): void {
  ipcRenderer.on(channel, listener)
}

/**
 * ipc removeListener：取消订阅（须传入与 addListener 相同的回调引用）
 * @param channel 通道名
 * @param listener 注册时的同一回调
 */
export function removeListener<C extends TIpcMsgChannel>(
  channel: C,
  listener: TIpcMsgListener<C>
): void {
  ipcRenderer.removeListener(channel, listener)
}
