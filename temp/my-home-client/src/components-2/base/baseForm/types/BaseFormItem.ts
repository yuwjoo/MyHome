/**
 * 表单项处理对象
 */
export type FormItemHandler = {
  prop: Readonly<Ref<string>>;
  errorMessage: Readonly<Ref<string>>;
  validateStatus: Readonly<Ref<ValidateStatus>>;
  validate: () => Promise<boolean>;
  clearValidate: () => void;
};

/**
 * 校验状态
 */
export type ValidateStatus = "" | "error" | "success";

/**
 * 基础表单项-提供对象
 */
export type BaseFormItemProvide = {
  errorMessage: Readonly<Ref<string>>;
  validateStatus: Readonly<Ref<ValidateStatus>>;
  triggerValidate: (eventName: "change" | "blur") => void;
};
