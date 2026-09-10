/**
 * @file 渲染侧 IPC 契约类型
 * @description 由主进程 IPC 契约自动推导渲染进程可用的域分组方法签名
 */
import type { IpcRendererEvent } from 'electron'
import type {
  TIpcApi,
  TIpcApiChannel,
  TIpcApiChannelArgs,
  TIpcApiChannelResult,
  TIpcMsgChannel,
  TIpcMsgPayload
} from '@shared/types/ipc'

/**
 * 推送订阅回调：主进程推送时携带事件与负载
 */
export type TIpcMsgListener<C extends TIpcMsgChannel> = (
  event: IpcRendererEvent,
  ...payload: TIpcMsgPayload<C>
) => void

/**
 * 提取通道域前缀，如 'release:getProjectList' → 'release'
 */
type TChannelDomain<C extends string> = C extends `${infer D}:${string}` ? D : C

/**
 * 去除通道前缀获得方法名，如 'release:getProjectList' → 'getProjectList'
 */
type TMethodName<C extends string> = C extends `${string}:${infer M}` ? M : C

/**
 * 通道方法签名：
 * - result 非空（invoke 请求-响应）→ (...args) => Promise<Result>
 * - result 为 void（send 单向通知）→ (...args) => void
 */
type TChannelMethod<C extends TIpcApiChannel> =
  TIpcApiChannelResult<C> extends void
    ? (...args: TIpcApiChannelArgs<C>) => void
    : (...args: TIpcApiChannelArgs<C>) => Promise<TIpcApiChannelResult<C>>

/**
 * 单个域的方法集合
 */
type TDomainShape<D extends string> = {
  [
    C in keyof TIpcApi as C extends `${D}:${string}` ? TMethodName<C & string> : never
  ]: TChannelMethod<C>
}

/**
 * 由 TIpcApi 契约自动推导的域分组形状：
 * { release: { getProjectList: () => Promise<...>, ... } }
 * 新增域前缀即自动新增顶层 key，与主进程契约保持一致
 */
export type TIpcApiShape = {
  [D in TChannelDomain<keyof TIpcApi & string>]: TDomainShape<D>
}
