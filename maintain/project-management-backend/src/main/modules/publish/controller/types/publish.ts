/**
 * @file 发布流程类型
 * @description 定义发布阶段、发布日志、发布参数、节点参数与日志回调结构
 */

/**
 * 发布阶段
 */
export type TPublishStage = 'prepare' | 'build' | 'upload' | 'finish'

/**
 * 一条发布日志
 */
export interface IPublishLog {
  /**
   * 当前所处阶段
   */
  stage: TPublishStage
  /**
   * 节点函数发出的内部消息
   */
  message: string
}

/**
 * 发布日志回调，发布过程中各阶段节点发消息时触发
 */
export type TPublishLogListener = (log: IPublishLog) => void

/**
 * 节点函数使用的日志发送器
 *
 * 只负责发消息，当前阶段由基类补上后再回调给外界
 */
export type TPublishLogger = (message: string) => void

/**
 * 节点参数：发布参数去掉日志回调
 *
 * 各阶段节点拿到的入参，后续扩展新字段加在这里，节点签名不用改
 */
export interface IPublishNodeParams {
  /**
   * 本次发布的目标版本号
   */
  targetVersion: string
}

/**
 * 发布参数：节点参数 + 可选的日志回调
 */
export interface IPublishParams extends IPublishNodeParams {
  /**
   * 日志回调，可选；不传则不输出发布过程日志
   */
  onLog?: TPublishLogListener
}
