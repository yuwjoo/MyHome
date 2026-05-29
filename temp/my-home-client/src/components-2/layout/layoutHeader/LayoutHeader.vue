<template>
  <div class="layout-header">
    <i-tabler:chevron-left v-if="showBack" class="layout-header__back" @click="$router.back()" />
    <div class="layout-header__content">
      <slot />
    </div>
    <div v-if="slots.right" class="home_header__right">
      <slot name="right" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { layoutHeaderProps } from "./props";
import type { LayoutHeaderSlots } from "./types";

const slots = defineSlots<LayoutHeaderSlots>();
defineProps(layoutHeaderProps);
</script>

<style lang="scss" scoped>
.layout-header {
  display: flex;
  height: var(--mh-layout-header-height);

  .layout-header__back {
    font-size: var(--mh-text-size-4xl);
    height: 100%;
  }

  .layout-header__content {
    flex-grow: 1;
  }

  .home_header__right {
    flex-shrink: 0;
  }
}
</style>
