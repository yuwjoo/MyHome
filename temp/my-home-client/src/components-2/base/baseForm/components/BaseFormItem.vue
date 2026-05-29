<template>
  <div class="base-form-item" :class="{ 'base-form-item--error': validateStatus === 'error' }">
    <slot />

    <div class="base-form-item__message">{{ errorMessage }}</div>
  </div>
</template>

<script lang="ts" setup>
import { BASE_FORM_PROVIDE, BASE_FORM_ITEM_PROVIDE } from "../common/constant";
import { baseFormItemProps } from "../props/BaseFormItem";
import type { BaseFormProvide, BaseFormRuleItem } from "../types/BaseForm";
import type { BaseFormItemProvide, ValidateStatus } from "../types/BaseFormItem";

const props = defineProps(baseFormItemProps);

const baseFormProvide = inject<BaseFormProvide>(BASE_FORM_PROVIDE);

const errorMessage = ref(""); // 异常消息
const validateStatus = ref<ValidateStatus>(""); // 校验状态

const rules = computed(() => {
  return props.rules || baseFormProvide?.rules.value?.[props.prop] || [];
}); // 校验规则

/**
 * 校验数据
 */
const validate = async (): Promise<boolean> => {
  return handleValidate(rules.value);
};

/**
 * 清除校验
 */
const clearValidate = async () => {
  validateStatus.value = "";
  errorMessage.value = "";
};

/**
 * 处理校验
 * @param rules 规则集合
 * @return 校验结果
 */
const handleValidate = async (rules: BaseFormRuleItem[]): Promise<boolean> => {
  if (!baseFormProvide) return true;
  const value = baseFormProvide.model.value[props.prop];
  let isValid = true;
  let message = "";

  for (const rule of rules) {
    const defaultMessage = typeof rule.message === "function" ? rule.message() : rule.message || "";

    if (rule.required) {
      isValid = !!value || value === 0;
      message = defaultMessage;
    }

    if (isValid && rule.validator) {
      try {
        const res = rule.validator(value);
        if (res instanceof Promise) {
          await res;
        } else {
          isValid = res ?? false;
        }
      } catch (err) {
        isValid = false;
        message = err instanceof Error ? err.message : (err as string) || defaultMessage;
      }
    }

    if (!isValid) break;
  }

  validateStatus.value = isValid ? "success" : "error";
  errorMessage.value = message;

  return isValid;
};

/**
 * 触发校验
 * @param eventName 事件名称
 */
const triggerValidate = (eventName: "change" | "blur"): Promise<boolean> => {
  return handleValidate(rules.value.filter((rule) => (rule.trigger || "change") === eventName));
};

baseFormProvide?.bindFormItem({
  prop: readonly(toRef(props, "prop")),
  errorMessage: readonly(errorMessage),
  validateStatus: readonly(validateStatus),
  validate,
  clearValidate
});
onBeforeUnmount(() => {
  baseFormProvide?.unbindFormItem(props.prop);
});

provide<BaseFormItemProvide>(BASE_FORM_ITEM_PROVIDE, {
  errorMessage: readonly(errorMessage),
  validateStatus: readonly(validateStatus),
  triggerValidate
});

defineExpose({ validate, clearValidate });
</script>

<style lang="scss" scoped>
.base-form-item {
  &.base-form-item--error {
    border: 1px solid var(--mh-color-danger);
    border-radius: var(--mh-radius-md);

    .base-form-item__message {
      display: block;
    }
  }

  .base-form-item__message {
    display: none;
    font-size: var(--mh-text-size-sm);
    color: var(--mh-color-danger);
  }
}
</style>
