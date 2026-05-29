<template>
  <div class="base-search-box">
    <i-tabler:search class="base-search-box__icon" />
    <span class="base-search-box__placeholder">搜索</span>
  </div>
</template>

<script setup lang="ts"></script>

<style lang="scss" scoped>
.base-search-box {
  display: flex;
  align-items: center;
  height: 34px;
  background-color: var(--mh-color-neutral-200);
  border-radius: var(--mh-radius-full);
  box-sizing: border-box;
  padding: 0 var(--mh-spacing-md);

  .base-search-box__icon {
    font-size: var(--mh-text-size-xl);
  }

  .base-search-box__placeholder {
    margin-left: var(--mh-spacing-xs);
    color: var(--mh-placeholder-text-color);
    line-height: var(--mh-line-height-same);
  }
}
</style>
