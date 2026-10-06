/**
 * @file 表单 hook 类型
 * @description 定义表单数据、校验规则与填充 / 校验能力的形态
 */
import type { Ref } from 'vue'
import type { FormRules } from 'element-plus'
import type { IProjectInfo } from '@shared/types/config/publishConfig'

/**
 * 表单能力
 */
export type TUseForm = {
  /**
   * 表单数据
   */
  formData: Ref<IProjectInfo>
  /**
   * 表单校验规则
   */
  rules: FormRules
  /**
   * 清除表单的校验痕迹
   */
  clearValidate: () => void
  /**
   * 校验表单
   * @returns 校验通过为 true
   */
  validate: () => Promise<boolean>
}
