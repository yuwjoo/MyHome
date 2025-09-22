<template>
  <div class="book-item" @click="handleClickItem(item)">
    <van-highlight class="book-item__title" :keywords="[searchValue]" :source-string="item.title" />
    <div class="book-item__info">
      <div class="book-item__classify">分类：{{ item.classify.name }}</div>
      <div class="book-item__author">
        作者：<van-highlight :keywords="[searchValue]" :source-string="item.author.name" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ApiSearchBookResult } from "@/api/types/book";
import { useRouter } from "@/router";
import type { PropType } from "vue";

defineOptions({
  name: "book-item"
});

defineProps({
  index: {
    type: Number,
    required: true
  },
  item: {
    type: Object as PropType<ApiSearchBookResult["list"][number]>,
    required: true
  },
  searchValue: {
    type: String,
    required: true
  }
});

const router = useRouter();

/**
 * @description: 点击书籍跳转到详情页
 * @param {ApiSearchBookResult["list"][number]} item 当前项
 */
const handleClickItem = (item: ApiSearchBookResult["list"][number]) => {
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
  padding: 15px 10px;
  border-bottom: 1px solid $border-color;

  .book-item__title {
    color: $font-color-dd;
    font-weight: bold;
  }

  .book-item__info {
    display: flex;
    justify-content: space-between;
    font-size: $font-size-medium;
    margin-top: 20px;

    .book-item__classify {
    }

    .book-item__author {
      display: flex;
    }
  }
}
</style>
