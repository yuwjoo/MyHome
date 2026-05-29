<template>
  <van-button
    class="base-button"
    :class="`base-button--${props.type}`"
    type="default"
    block
    round
    :size="size"
    :disabled="disabled"
    :loading="loading"
    @click="emits('click', $event)"
  >
    <template #icon>
      <slot name="icon" />
    </template>

    <slot />
  </van-button>
</template>

<script setup lang="ts">
import type { BaseButtonEmits, BaseButtonSlots } from "./types";
import { baseButtonProps } from "./props";

defineSlots<BaseButtonSlots>();
const props = defineProps(baseButtonProps);
const emits = defineEmits<BaseButtonEmits>();
</script>

<style lang="scss" scoped>
.base-button {
  border: none;
  font-weight: 700;
  font-size: var(--mh-text-size-md);

  &.base-button--default {
    color: var(--mh-base-text-color);
    background-color: transparent;
  }

  &.base-button--primary {
    color: var(--mh-color-white);
    background-color: var(--mh-color-primary);
  }

  &.base-button--success {
    color: var(--mh-color-white);
    background-color: var(--mh-color-success);
  }

  &.base-button--warning {
    color: var(--mh-color-white);
    background-color: var(--mh-color-warning);
  }

  &.base-button--danger {
    color: var(--mh-color-white);
    background-color: var(--mh-color-danger);
  }

  &.base-button--info {
    color: var(--mh-color-white);
    background-color: var(--mh-color-neutral);
  }
}

.van-button {
  &.van-button--normal {
    font-size: var(--mh-text-size-lg);
    height: 42px;
  }

  &.van-button--small {
    font-size: var(--mh-text-size-sm);
    height: 32px;
  }

  :deep(.van-button__content) {
    .van-button__icon {
      line-height: 0;
    }
  }
}
</style>
