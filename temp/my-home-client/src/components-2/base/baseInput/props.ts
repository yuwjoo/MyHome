import { fieldProps } from "vant";

export const baseInputProps = {
  /**
   * 输入框类型
   */
  type: fieldProps.type,
  /**
   * 输入框占位提示文字
   */
  placeholder: fieldProps.placeholder,
  /**
   * 是否禁用输入框
   */
  disabled: fieldProps.disabled,
  /**
   * 是否为只读状态，只读状态下无法输入内容
   */
  readonly: fieldProps.readonly,
  /**
   * 输入的最大字符数
   */
  maxlength: fieldProps.maxlength,
  /**
   * 是否启用清除图标，点击清除图标后会清空输入框
   */
  clearable: fieldProps.clearable
} as const;

export const baseInputModels = {
  /**
   * 输入内容
   */
  modelValue: {
    type: String,
    required: false
  }
};
