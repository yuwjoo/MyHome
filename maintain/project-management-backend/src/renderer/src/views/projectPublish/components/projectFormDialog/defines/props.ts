/**
 * @file 项目表单弹窗组件 props 定义
 * @description 弹窗的打开与保存都由组件内部完成，对外只需提供去重校验用的项目列表
 */
import type { PropType } from 'vue'
import type { IProjectInfo } from '@shared/types/config/publishConfig'

/**
 * 项目表单弹窗组件 props
 */
export const projectFormDialogProps = {
  /** 已有项目列表，用于校验项目是否重复 */
  projects: {
    type: Array as PropType<IProjectInfo[]>,
    default: () => []
  }
} as const
