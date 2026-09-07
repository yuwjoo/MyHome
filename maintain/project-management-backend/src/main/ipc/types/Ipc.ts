/**
 * @file IPC 聚合契约
 */
import type { ReleaseIpcApi, ReleaseIpcMsg } from './releaseIpc'

/**
 * API 聚合契约
 */
export type IpcApi = ReleaseIpcApi

/**
 * API 通道名
 */
export type IpcApiChannel = keyof IpcApi

/**
 * API 通道参数
 */
export type IpcApiChannelArgs<C extends IpcApiChannel> = IpcApi[C]['args']

/**
 * API 通道结果
 */
export type IpcApiChannelResult<C extends IpcApiChannel> = IpcApi[C]['result']

/**
 * MSG 聚合契约
 */
export type IpcMsg = ReleaseIpcMsg

/**
 * MSG 通道名
 */
export type IpcMsgChannel = keyof IpcMsg

/**
 * MSG 通道负载
 */
export type IpcMsgPayload<C extends IpcMsgChannel> = IpcMsg[C]
