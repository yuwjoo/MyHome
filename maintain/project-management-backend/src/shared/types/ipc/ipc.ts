/**
 * @file IPC 契约类型
 * @description 汇总各域 IPC 契约并派生通道工具类型；各域自身的类型请直接引入对应域文件（如 ./publish）
 */
import type { IPublishApi, IPublishMsg } from './publish'

/**
 * API 聚合契约
 */
export type TIpcApi = IPublishApi

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
export type TIpcMsg = IPublishMsg

/**
 * MSG 通道名
 */
export type TIpcMsgChannel = keyof TIpcMsg

/**
 * MSG 通道负载
 */
export type TIpcMsgPayload<C extends TIpcMsgChannel> = TIpcMsg[C]
