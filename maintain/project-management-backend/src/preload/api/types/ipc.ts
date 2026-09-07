/**
 * @file 渲染侧 IPC 契约推导类型
 */
import type { IpcRendererEvent } from 'electron'
import type {
  IpcApi,
  IpcApiChannel,
  IpcApiChannelArgs,
  IpcApiChannelResult,
  IpcMsgChannel,
  IpcMsgPayload
} from '@main/ipc/types/Ipc'

/**
 * 推送订阅回调：主进程推送时携带事件与负载
 */
export type IpcMsgListener<C extends IpcMsgChannel> = (
  event: IpcRendererEvent,
  ...payload: IpcMsgPayload<C>
) => void

/**
 * 提取通道域前缀，如 'release:getProjectList' → 'release'
 */
type ChannelDomain<C extends string> = C extends `${infer D}:${string}` ? D : C

/**
 * 去除通道前缀获得方法名，如 'release:getProjectList' → 'getProjectList'
 */
type MethodName<C extends string> = C extends `${string}:${infer M}` ? M : C

/**
 * 通道方法签名：
 * - result 非空（invoke 请求-响应）→ (...args) => Promise<Result>
 * - result 为 void（send 单向通知）→ (...args) => void
 */
type ChannelMethod<C extends IpcApiChannel> =
  IpcApiChannelResult<C> extends void
    ? (...args: IpcApiChannelArgs<C>) => void
    : (...args: IpcApiChannelArgs<C>) => Promise<IpcApiChannelResult<C>>

/**
 * 单个域的方法集合
 */
type DomainShape<D extends string> = {
  [
    C in keyof IpcApi as C extends `${D}:${string}` ? MethodName<C & string> : never
  ]: ChannelMethod<C>
}

/**
 * 由 IpcApi 契约自动推导的域分组形状：
 * { release: { getProjectList: () => Promise<...>, ... } }
 * 新增域前缀即自动新增顶层 key，与主进程契约保持一致
 */
export type IpcApiShape = {
  [D in ChannelDomain<keyof IpcApi & string>]: DomainShape<D>
}
