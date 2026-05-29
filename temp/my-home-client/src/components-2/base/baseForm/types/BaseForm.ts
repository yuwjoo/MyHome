import type { ExtractPropTypes } from "vue";
import type { baseFormProps } from "../props/BaseForm";
import type { FormItemHandler } from "./BaseFormItem";

/**
 * 基础表单-slots
 */
export type BaseFormSlots = {
  /**
   * 内容区域
   */
  default?: () => void;
};

/**
 * 表单规则集合
 */
export type BaseFormRules = Record<string, BaseFormRuleItem[]>;

/**
 * 规则项
 */
export type BaseFormRuleItem = {
  required?: boolean;
  validator?: (val: any) => Promise<void> | boolean;
  message?: (() => string) | string;
  trigger?: "change" | "blur";
};

/**
 * 基础表单-提供对象
 */
export type BaseFormProvide = {
  model: Ref<ExtractPropTypes<typeof baseFormProps>["model"]>;
  rules: Ref<ExtractPropTypes<typeof baseFormProps>["rules"]>;
  bindFormItem: (handler: FormItemHandler) => void;
  unbindFormItem: (prop: string) => void;
};

/**
 * 校验表单数据-结果
 */
export type ValidateResult = {
  isValid: boolean;
  invalidFields: Record<string, string>;
};
