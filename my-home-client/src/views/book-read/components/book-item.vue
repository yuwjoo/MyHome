<template>
  <div class="book-item">
    <h1 class="book-item__title">{{ item.title }}</h1>
    <p class="book-item__text" v-for="(text, index) in item.paragraphs" :key="index">
      {{ text }}
    </p>
  </div>
</template>

<script setup lang="ts">
import type { ApiGetBookContentResult } from "@/api/types/book";

defineOptions({
  name: "book-item"
});

defineProps({
  index: {
    type: Number,
    required: true
  },
  item: {
    type: Object as PropType<ApiGetBookContentResult>,
    required: true
  }
});
</script>

<style lang="scss" scoped>
.book-item {
  padding-bottom: 10px;

  &:last-of-type {
    padding-bottom: 72px;
  }

  .book-item__title {
    width: 100%;
    font-size: calc(24px + var(--book-read-font-size-scale));
    line-height: 48px;
    color: var(--book-read-title-color, $font-color-dd);
    padding-top: 32px;
    font-weight: 600;
  }

  .book-item__text {
    margin-top: 8px;
    width: 100%;
    text-indent: 32px;
    line-height: 1.5;
    color: var(--book-read-color);
    font-size: calc(1em + var(--book-read-font-size-scale));
  }
}
</style>
