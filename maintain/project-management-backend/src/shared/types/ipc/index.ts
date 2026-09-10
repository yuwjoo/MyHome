/**
 * @file IPC 契约出口
 * @description 汇总各域 IPC 契约并派生通道工具类型，供主进程与预加载脚本共用
 */
import type { IReleaseApi, IReleaseMsg } from './release'

export type { IReleaseApi, IReleaseMsg }

/**
 * API 聚合契约
 */
export type TIpcApi = IReleaseApi

/**
 * API 通道名
 */
export type TIpcApiChannel = keyof TIpcApi

/**
 * API 通道参数
 */
export type TIpcApiChannelArgs<C extends TIpcApiChannel> = TIpcApi[C]['args']

/**
 * API 通道结果
 */
export type TIpcApiChannelResult<C extends TIpcApiChannel> = TIpcApi[C]['result']

/**
 * MSG 聚合契约
 */
export type TIpcMsg = IReleaseMsg

/**
 * MSG 通道名
 */
export type TIpcMsgChannel = keyof TIpcMsg

/**
 * MSG 通道负载
 */
export type TIpcMsgPayload<C extends TIpcMsgChannel> = TIpcMsg[C]
