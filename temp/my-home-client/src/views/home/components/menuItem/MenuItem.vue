<template>
  <base-card class="menu-item">
    <div class="menu-item__cover">
      <component :is="item.icon" class="menu-item__cover-icon" />
    </div>
    <div class="menu-item__label">{{ item.label }}</div>
  </base-card>
</template>

<script lang="ts" setup>
import BaseCard from "@/components-2/base/baseCard/BaseCard.vue";
import { menuItemProps } from "./props";

defineProps(menuItemProps);
</script>

<style lang="scss" scoped>
.menu-item {
  &.base-card {
    :deep(.base-card__body) {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
  }

  .menu-item__cover {
    .menu-item__cover-icon {
      display: block;
      font-size: var(--mh-text-size-3xl);
    }
  }

  .menu-item__label {
    margin-top: var(--mh-spacing-sm);
  }
}
</style>
