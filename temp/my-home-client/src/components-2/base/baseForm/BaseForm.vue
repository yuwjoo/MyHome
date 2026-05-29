<template>
  <form class="base-form">
    <slot />
  </form>
</template>

<script lang="ts" setup>
import { BASE_FORM_PROVIDE } from "./common/constant";
import { baseFormProps } from "./props/BaseForm";
import type { BaseFormProvide, BaseFormSlots, ValidateResult } from "./types/BaseForm";
import type { FormItemHandler } from "./types/BaseFormItem";

defineSlots<BaseFormSlots>();
const props = defineProps(baseFormProps);

const formItemMap: Record<string, FormItemHandler> = {}; // 表单项map

/**
 * 绑定表单项
 * @param handler 表单项处理对象
 */
const bindFormItem = (handler: FormItemHandler) => {
  formItemMap[handler.prop.value] = handler;
};

/**
 * 解绑表单项
 * @param prop 表单项prop
 */
const unbindFormItem = (prop: string) => {
  delete formItemMap[prop];
};

provide<BaseFormProvide>(BASE_FORM_PROVIDE, {
  model: toRef(props, "model"),
  rules: toRef(props, "rules"),
  bindFormItem,
  unbindFormItem
});

/**
 * 校验表单数据
 * @return 校验结果
 */
const validate = async (): Promise<ValidateResult> => {
  const invalidFields: Record<string, string> = {};

  for (const handler of Object.values(formItemMap)) {
    let isPass: boolean;
    try {
      isPass = await handler.validate();
    } catch {
      isPass = false;
    }
    if (!isPass) {
      invalidFields[handler.prop.value] = handler.errorMessage.value;
    }
  }

  return {
    isValid: Object.keys(invalidFields).length === 0,
    invalidFields
  };
};

/**
 * 移除表单校验结果
 */
const clearValidate = () => {
  Object.values(formItemMap).forEach((handler) => {
    handler.clearValidate();
  });
};

defineExpose({ validate, clearValidate });
</script>

<style lang="scss" scoped></style>
