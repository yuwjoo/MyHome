<template>
  <div class="book-page-scroll" @scroll.passive="handleScroll">
    <div class="book-page-scroll__header"></div>
    <div v-for="page in pages" :key="page.id" class="book-page-scroll__page">
      <h1 class="book-page-scroll__page-title">{{ page.title }}</h1>
      <p v-for="(text, index) in page.lines" :key="index" class="book-page-scroll__page-line">
        {{ text }}
      </p>
    </div>
    <div class="book-page-scroll__footer"></div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from "vue";
import type { BookPagePage } from "./book-page.vue";

defineOptions({
  name: "book-page-scroll"
});

defineProps({
  // 数据
  pages: {
    type: Array as PropType<BookPagePage[]>
  }
});

const handleScroll = (ev: Event) => {
  ev;
  // console.log(ev);
};
</script>

<style lang="scss" scoped>
.book-page-scroll {
  height: 100vh;
  overflow-y: auto;

  &__header {
  }

  &__page {
    &-title {
      font-size: 24px;
      line-height: 48px;
      color: $font-color-dd;
      padding-top: 32px;
      font-weight: 600;
    }

    &-line {
      word-break: break-all;
      margin-top: 8px;
      text-indent: 32px;
      line-height: 1.5;
      color: var(--book-read-color);
    }
  }

  &__footer {
  }
}
</style>
