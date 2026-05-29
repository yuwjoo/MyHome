<template>
  <van-cell
    class="base-cell"
    :class="`base-cell--value-${valueAlign}`"
    :title="title"
    :value="value"
    center
    :clickable="clickable"
    :is-link="isLink"
  >
    <template v-if="slots.title" #title>
      <slot name="title" />
    </template>

    <template v-if="slots.value" #value>
      <slot name="value" />
    </template>
  </van-cell>
</template>

<script setup lang="ts">
import type { BaseCellSlots } from "./types";
import { baseCellProps } from "./props";

const slots = defineSlots<BaseCellSlots>();
defineProps(baseCellProps);
</script>

<style lang="scss" scoped>
.base-cell {
  padding: var(--mh-container-vertical-padding) var(--mh-container-horizontal-padding);
  font-size: var(--mh-text-size-lg);
  color: var(--mh-base-text-color);
  line-height: var(--mh-line-height-same);
  background-color: var(--mh-container-color-bg);

  &:active {
    background-color: var(--mh-container-color-bg-hove);
  }

  &::after {
    right: 0;
  }

  &.base-cell--value-left {
    :deep(.van-cell__value) {
      text-align: left;
    }
  }

  &.base-cell--value-center {
    :deep(.van-cell__value) {
      text-align: center;
    }
  }

  &.base-cell--value-right {
    :deep(.van-cell__value) {
      text-align: right;
    }
  }
}
</style>
