/**
 * @file emits 工具类型
 * @description 从元组式 emits 定义中取出单个事件的派发函数，
 *   用于把 hook 的派发权限收窄到指定事件：事件名与参数都由组件的 emits 推导，不用手写
 */
/**
 * 只抛出指定事件的派发函数
 *
 * @param E 组件的 emits 定义，元组式：`{ change: [project: IProjectInfo] }`
 * @param K 允许抛出的事件名
 */
export type TEmitOnly<E extends Record<string, unknown[]>, K extends keyof E> = (
  event: K,
  ...args: E[K]
) => void
