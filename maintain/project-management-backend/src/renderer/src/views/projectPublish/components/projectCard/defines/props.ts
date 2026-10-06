/**
 * @file 项目卡片组件 props 定义
 * @description 展示用数据由父组件持有，卡片只负责渲染与抛出操作事件
 */
import type { PropType } from 'vue'
import type { IProjectInfo } from '@shared/types/config/publishConfig'
import type { IPublishLogItem } from '../../../types/publish'

/**
 * 项目卡片组件 props
 */
export const projectCardProps = {
  /** 项目信息 */
  project: {
    type: Object as PropType<IProjectInfo>,
    required: true
  },
  /** 本次发布的目标版本号：由父组件持有，便于发布后自动推进到下一版 */
  targetVersion: {
    type: String,
    required: true
  },
  /** 该项目是否正在发布 */
  publishing: {
    type: Boolean,
    default: false
  },
  /** 该项目最新一条日志，用于展示当前动作，没有日志时为 null */
  latestLog: {
    type: Object as PropType<IPublishLogItem | null>,
    default: null
  },
  /** 该项目累计日志条数 */
  logCount: {
    type: Number,
    default: 0
  }
} as const
