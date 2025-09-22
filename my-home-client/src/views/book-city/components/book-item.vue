<template>
  <div class="book-item" @click="handleClickItem(item)">
    <van-image class="book-item__img" :src="item.cover" fit="cover"></van-image>
    <div class="book-item__content">
      <div class="book-item__title">{{ item.title }}</div>
      <div class="book-item__intro">{{ item.intro }}</div>
      <div class="book-item__info">
        <div class="book-item__author">作者：{{ item.author.name }}</div>
        <div class="book-item__update-date">最近更新：{{ item.updateDate }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "@/router";
import type { PropType } from "vue";
import type { BookListItem } from "../types/book-city";

defineOptions({
  name: "book-item"
});

defineProps({
  index: {
    type: Number,
    required: true
  },
  item: {
    type: Object as PropType<BookListItem>,
    required: true
  }
});

const router = useRouter();

/**
 * @description: 点击书籍跳转到详情页
 * @param {BookListItem} item 当前项
 */
const handleClickItem = (item: BookListItem) => {
  router.push({
    name: "book-detail",
    query: {
      id: item.id
    }
  });
};
</script>

<style lang="scss" scoped>
.book-item {
  padding: 16px 10px;
  border-bottom: 1px solid $border-color;
  display: flex;

  &__img {
    width: 70px;
    height: 100px;
    border-radius: 5px;
    flex-shrink: 0;
    overflow: hidden;
    box-shadow: 3px 3px 5px rgba(0, 0, 0, 0.2);
  }

  &__content {
    width: 0;
    flex-grow: 1;
    margin: 5px 0 5px 10px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .book-item__title {
    font-size: $font-size-large;
    color: $font-color-dd;
    font-weight: bold;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }

  .book-item__intro {
    margin-top: 10px;
    color: $font-color-d;
    font-size: $font-size-medium;
    line-height: 1.2;
    display: -webkit-box;
    text-overflow: ellipsis;
    overflow: hidden;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .book-item__info {
    margin-top: 10px;
    font-size: $font-size-small;
    display: flex;
    justify-content: space-between;
  }
}
</style>
