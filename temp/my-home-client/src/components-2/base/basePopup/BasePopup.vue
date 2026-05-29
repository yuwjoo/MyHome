<template>
  <van-popup
    class="base-popup"
    :show="isShow"
    position="bottom"
    round
    :closeable="closeable"
    :style="{ height: height }"
    @update:show="isShow = $event"
  >
    <div class="base-popup__body">
      <div v-if="slots.title || title" class="base-popup__body-title">
        <slot name="title">{{ title }}</slot>
      </div>
      <div class="base-popup__body-content">
        <slot />
      </div>
    </div>
  </van-popup>
</template>

<script setup lang="ts">
import { basePopupModels, basePopupProps } from "./props";
import type { BasePopupSlots } from "./types";

const slots = defineSlots<BasePopupSlots>();
defineProps(basePopupProps);

const isShow = defineModel("show", basePopupModels.show);
</script>

<style lang="scss" scoped>
.base-popup {
  .base-popup__body {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: var(--mh-spacing-md) var(--mh-spacing-lg);
    box-sizing: border-box;

    .base-popup__body-title {
      color: var(--mh-title-text-color-md);
      font-size: var(--mh-title-text-size-md);
      font-weight: var(--mh-title-font-weight-md);
      line-height: var(--mh-title-line-height-md);
      text-align: center;
      padding: 7px 0 var(--mh-spacing-xl);
    }

    .base-popup__body-content {
      height: 0;
      flex-grow: 1;
    }
  }
}
</style>
