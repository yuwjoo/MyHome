<template>
  <div class="base-card" :class="{ 'base-card--no-padding': noPadding }">
    <div v-if="title || slots.header" class="base-card-block base-card__header">
      <slot name="header">
        <span class="mh-title-sm">{{ title }}</span>
      </slot>
    </div>

    <div class="base-card-block base-card__body">
      <slot></slot>
    </div>

    <div v-if="slots.footer" class="base-card-block base-card__footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BaseCardSlots } from "./types";
import { baseCardProps } from "./props";

const slots = defineSlots<BaseCardSlots>();
defineProps(baseCardProps);
</script>

<style lang="scss" scoped>
// 卡片背景颜色
$card-bg-color: var(--mh-container-color-bg);
// 卡片圆角
$card-border-radius: var(--mh-container-border-radius);
// 卡片垂直内边距
$card-vertical-padding: var(--mh-container-vertical-padding);
// 卡片水平内边距
$card-horizontal-padding: var(--mh-container-horizontal-padding);

.base-card {
  background-color: $card-bg-color;
  border-radius: $card-border-radius;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  &.base-card--no-padding {
    .base-card-block {
      &.base-card__body {
        padding: 0;
      }

      &.base-card__footer {
        padding-top: 0;
      }
    }
  }

  .base-card-block {
    padding: $card-vertical-padding $card-horizontal-padding 0;

    &:last-child {
      padding-bottom: $card-vertical-padding;
    }
  }

  .base-card__header {
    flex-shrink: 0;
  }

  .base-card__body {
    flex-grow: 1;
  }

  .base-card__footer {
    flex-shrink: 0;
  }
}
</style>
