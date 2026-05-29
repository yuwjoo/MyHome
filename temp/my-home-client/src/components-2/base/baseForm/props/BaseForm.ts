import type { PropType } from "vue";
import type { BaseFormRules } from "../types/BaseForm";

/**
 * 基础表单-props
 */
export const baseFormProps = {
  /**
   * 表单数据对象
   */
  model: {
    type: Object as PropType<Record<string, any> | Record<string, any>[]>,
    required: true
  },
  /**
   * 表单验证规则
   */
  rules: {
    type: Object as PropType<BaseFormRules>,
    required: false
  },
  /**
   * 禁用状态
   */
  disabled: {
    type: Boolean,
    default: false
  }
} as const;
