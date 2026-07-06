/**
 * messageUtils 参数类型约束，基于 group 类型生成
 */
import type { Groups } from './index'

/**
 * 筛选包含指定类型消息的分组名称
 */
type GroupName<T extends 'action' | 'event'> = {
  [K in keyof Groups & string]: Extract<Groups[K][keyof Groups[K]], { type: T }> extends never ? never : K
}[keyof Groups & string]

/**
 * 筛选指定分组下指定类型的消息名称
 */
type MessageName<G extends GroupName<'action' | 'event'>, T extends 'action' | 'event'> = {
  [K in keyof Groups[G] & string]: Groups[G][K] extends { type: T } ? K : never
}[keyof Groups[G] & string]

/**
 * 根据分组名称和消息名称提取 params 类型
 */
type Params<G extends GroupName<'action' | 'event'>, M extends keyof Groups[G] & string> =
  Groups[G][M] extends { params: infer P } ? P : never

/**
 * 根据分组名称和消息名称提取 callbacks 类型
 */
type Callbacks<G extends GroupName<'action' | 'event'>, M extends keyof Groups[G] & string> =
  Groups[G][M] extends { callbacks: infer C } ? C : never

/**
 * 包含 action 消息的分组名称
 */
export type ActionGroupName = GroupName<'action'>

/**
 * 包含 event 消息的分组名称
 */
export type EventGroupName = GroupName<'event'>

/**
 * 指定分组下的 action 消息名称
 */
export type ActionMessageName<G extends ActionGroupName> = MessageName<G, 'action'>

/**
 * 指定分组下的 event 消息名称
 */
export type EventMessageName<G extends EventGroupName> = MessageName<G, 'event'>

/**
 * 指定 action 消息的 params 类型
 */
export type ActionParams<G extends ActionGroupName, M extends ActionMessageName<G>> = Params<G, M>

/**
 * 指定 event 消息的 params 类型
 */
export type EventParams<G extends EventGroupName, M extends EventMessageName<G>> = Params<G, M>

/**
 * 指定 action 消息的 callbacks 类型
 */
export type ActionCallbacks<G extends ActionGroupName, M extends ActionMessageName<G>> = Callbacks<G, M>

/**
 * 指定 event 消息的 callbacks 类型
 */
export type EventCallbacks<G extends EventGroupName, M extends EventMessageName<G>> = Callbacks<G, M>

/**
 * event 消息的回调函数类型
 */
export type EventCallback<G extends EventGroupName, M extends EventMessageName<G>> = (
  data: EventCallbacks<G, M> extends Record<string, infer Fn>
    ? (Fn extends (...args: any[]) => any ? Parameters<Fn>[0] : never)
    : never,
) => void
