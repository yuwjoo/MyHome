/**
 * @file 发布页类型
 * @description 定义发布页展示所需的日志条目形态
 */
import type { IPublishLogMsg } from '@shared/types/ipc/publish'

/**
 * 发布日志条目
 *
 * 主进程推送的日志 + 页面展示用的自增序号与时间戳
 */
export interface IPublishLogItem extends IPublishLogMsg {
  /**
   * 日志序号：页面内自增，作为列表 key 与排序依据
   */
  id: number
  /**
   * 收到日志的时间戳（毫秒）
   */
  time: number
}
