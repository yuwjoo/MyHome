<template>
  <van-field
    class="base-input"
    v-model="inputValue"
    :type="type"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="readonly"
    :maxlength="maxlength"
    :clearable="clearable"
    @input="onInput"
    @blur="onBlur"
  />
</template>

<script lang="ts" setup>
import { BASE_FORM_ITEM_PROVIDE } from "../baseForm/common/constant";
import type { BaseFormItemProvide } from "../baseForm/types/BaseFormItem";
import { baseInputModels, baseInputProps } from "./props";
import type { BaseInputEmits } from "./types";

defineProps(baseInputProps);
const emits = defineEmits<BaseInputEmits>();

const inputValue = defineModel(baseInputModels.modelValue); // 输入内容

const formItemProvide = inject<BaseFormItemProvide | null>(BASE_FORM_ITEM_PROVIDE, null);

/**
 * 监听输入
 * @param event 事件名称
 */
const onInput = (event: InputEvent) => {
  emits("input", event);
  formItemProvide?.triggerValidate("change");
};

/**
 * 监听失焦
 */
const onBlur = () => {
  formItemProvide?.triggerValidate("blur");
};
</script>

<style lang="scss" scoped>
.base-input {
  background-color: var(--mh-color-neutral-200);
  border-radius: 8px;

  :deep(.van-field__body) {
    .van-field__control {
      color: var(--mh-base-text-color);

      &::placeholder {
        color: var(--mh-placeholder-text-color);
      }
    }
  }
}
</style>
