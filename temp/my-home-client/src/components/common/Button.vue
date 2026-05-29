<template>
  <button
    :class="[
      'btn',
      `btn--${type}`,
      `btn--${size}`,
      { 'btn--disabled': disabled || loading },
      { 'btn--loading': loading }
    ]"
    :disabled="disabled || loading"
    @click="$emit('click')"
  >
    <div v-if="loading" class="btn__loading">
      <svg class="btn__spinner" viewBox="0 0 24 24">
        <circle class="btn__path" cx="12" cy="12" r="10" fill="none" stroke-width="2"></circle>
      </svg>
    </div>
    <slot v-else></slot>
  </button>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    type?: "primary" | "secondary" | "success" | "danger" | "text";
    size?: "small" | "medium" | "large";
    disabled?: boolean;
    loading?: boolean;
  }>(),
  {
    type: "primary",
    size: "medium",
    disabled: false,
    loading: false
  }
);

// 事件
defineEmits<{
  click: [];
}>();
</script>

<style scoped lang="scss">
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

  &:focus {
    outline: 2px solid rgba(66, 153, 225, 0.5);
    outline-offset: 2px;
  }

  // 类型变体
  &--primary {
    background-color: #4299e1;
    color: white;

    &:hover:not(:disabled) {
      background-color: #3182ce;
    }
  }

  &--secondary {
    background-color: #e2e8f0;
    color: #2d3748;

    &:hover:not(:disabled) {
      background-color: #cbd5e0;
    }
  }

  &--success {
    background-color: #48bb78;
    color: white;

    &:hover:not(:disabled) {
      background-color: #38a169;
    }
  }

  &--danger {
    background-color: #f56565;
    color: white;

    &:hover:not(:disabled) {
      background-color: #e53e3e;
    }
  }

  &--text {
    background-color: transparent;
    color: #4299e1;

    &:hover:not(:disabled) {
      background-color: rgba(66, 153, 225, 0.1);
    }
  }

  // 大小变体
  &--small {
    padding: 4px 8px;
    font-size: 12px;
  }

  &--medium {
    padding: 6px 12px;
    font-size: 14px;
  }

  &--large {
    padding: 8px 16px;
    font-size: 16px;
  }

  // 禁用状态
  &--disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  // 加载状态
  &--loading {
    color: transparent;
  }

  .btn__loading {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .btn__spinner {
    width: 16px;
    height: 16px;
    animation: rotate 1s linear infinite;
  }

  .btn__path {
    stroke: currentColor;
    stroke-dasharray: 40;
    stroke-dashoffset: 0;
    animation: dash 1.5s ease-in-out infinite;
  }

  @keyframes rotate {
    100% {
      transform: rotate(360deg);
    }
  }

  @keyframes dash {
    0% {
      stroke-dashoffset: 40;
    }
    70% {
      stroke-dashoffset: 0;
    }
    100% {
      stroke-dashoffset: -40;
    }
  }
}
</style>
