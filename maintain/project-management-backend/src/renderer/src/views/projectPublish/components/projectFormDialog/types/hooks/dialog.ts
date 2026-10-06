/**
 * @file 弹窗显隐 hook 类型
 * @description 定义弹窗展示状态、当前模式与打开 / 关闭能力的形态
 */
import type { Ref } from 'vue'
import type { IProjectInfo } from '@shared/types/config/publishConfig'

/**
 * 弹窗显隐能力
 */
export type TUseDialog = {
  /**
   * 弹窗展示状态
   */
  visible: Ref<boolean>
  /**
   * 是否为修改模式
   */
  isEdit: Ref<boolean>
  /**
   * 以新增模式打开弹窗
   */
  openCreate: () => void
  /**
   * 以修改模式打开弹窗
   * @param project 待修改的项目
   */
  openEdit: (project: IProjectInfo) => void
  /**
   * 关闭弹窗
   */
  close: () => void
}
