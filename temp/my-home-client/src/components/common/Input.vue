<template>
  <div :class="['input-wrapper', { 'input-wrapper--error': error }]">
    <label v-if="label" :for="id" class="input-label">{{ label }}</label>
    <input
      :id="id"
      :type="type"
      :class="['input', `input--${size}`]"
      :placeholder="placeholder"
      :value="modelValue"
      :disabled="disabled"
      :readonly="readonly"
      :required="required"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @focus="$emit('focus')"
      @blur="$emit('blur')"
      @keydown.enter="$emit('enter')"
    />
    <div v-if="error" class="input-error-message">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
// 导入uuid生成工具函数
import { v4 as uuidv4 } from "uuid";

// 输入框属性
withDefaults(
  defineProps<{
    modelValue: string;
    id?: string;
    label?: string;
    type?: "text" | "password" | "email" | "number" | "tel";
    placeholder?: string;
    size?: "small" | "medium" | "large";
    disabled?: boolean;
    readonly?: boolean;
    required?: boolean;
    error?: string;
  }>(),
  {
    id: () => uuidv4(),
    type: "text",
    size: "medium",
    disabled: false,
    readonly: false,
    required: false
  }
);

// 事件
defineEmits<{
  "update:modelValue": [value: string];
  focus: [];
  blur: [];
  enter: [];
}>();
</script>

<style scoped lang="scss">
.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;

  &--error .input {
    border-color: #f56565;
  }
}

.input-label {
  font-size: 14px;
  font-weight: 500;
  color: #4a5568;
}

.input {
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    outline: none;
    border-color: #4299e1;
    box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.1);
  }

  &:disabled {
    background-color: #f7fafc;
    cursor: not-allowed;
    opacity: 0.6;
  }

  &:read-only {
    background-color: #f7fafc;
  }

  // 大小变体
  &--small {
    padding: 4px 8px;
    font-size: 12px;
  }

  &--medium {
    padding: 8px 12px;
    font-size: 14px;
  }

  &--large {
    padding: 10px 16px;
    font-size: 16px;
  }
}

.input-error-message {
  font-size: 12px;
  color: #f56565;
  margin-top: 2px;
}
</style>
