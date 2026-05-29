import type { PropType } from "vue";
import type { BaseFormRuleItem } from "../types/BaseForm";

/**
 * 基础表单项-props
 */
export const baseFormItemProps = {
  /**
   * model的键名
   */
  prop: {
    type: String,
    required: true
  },
  /**
   * 标签文本
   */
  label: {
    type: String,
    required: false
  },
  /**
   * 表单验证规则
   */
  rules: {
    type: Array as PropType<BaseFormRuleItem[]>,
    required: false
  }
} as const;
