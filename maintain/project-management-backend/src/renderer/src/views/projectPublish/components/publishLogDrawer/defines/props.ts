/**
 * @file 发布日志抽屉组件 props 定义
 * @description 抽屉的展示状态与日志数据由父组件持有，清空动作以事件抛出
 */
import type { PropType } from 'vue'
import type { IPublishLogItem } from '../../../types/publish'

/**
 * 发布日志抽屉组件 props
 */
export const publishLogDrawerProps = {
  /** 是否展示抽屉 */
  modelValue: {
    type: Boolean,
    default: false
  },
  /** 抽屉标题 */
  title: {
    type: String,
    default: ''
  },
  /** 当前展示的日志列表 */
  logs: {
    type: Array as PropType<IPublishLogItem[]>,
    default: () => []
  },
  /** 是否展示日志所属项目：汇总日志时需要 */
  showProject: {
    type: Boolean,
    default: false
  }
} as const
