/**
 * @file 下拉数据 hook 类型
 * @description 定义下拉 / 提示用选项数据的形态
 */
import type { ComputedRef } from 'vue'
import type { TPublishController } from '@shared/types/config/publishConfig'

/**
 * 下拉选项
 *
 * @param T 取值的类型，默认字符串
 */
export type TOptionItem<T = string> = {
  /**
   * 实际取值
   */
  value: T
  /**
   * 展示文案
   */
  label: string
}

/**
 * 下拉数据能力
 */
export type TUseOptions = {
  /**
   * 发布控制器选项
   */
  controllerOptions: ComputedRef<TOptionItem<TPublishController>[]>
  /**
   * 项目类型提示：已有项目的类型去重列表
   */
  projectTypeOptions: ComputedRef<string[]>
}
