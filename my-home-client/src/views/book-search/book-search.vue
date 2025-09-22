<template>
  <div class="book-search">
    <van-search v-model="searchValue" placeholder="请输入书名或者作者名" @search="handleSearch" @clear="handleClear" />

    <virtual-list
      class="book-search__list"
      :list="list"
      :min-item-size="80"
      :loading="loading"
      key-field="id"
      @scroll-to-bottom="handleScrollToBottom"
    >
      <template #default="{ item, index }">
        <book-item :item="item" :index="index" :search-value="searchValue" />
      </template>
    </virtual-list>
  </div>
</template>

<script setup lang="ts">
import { searchBook } from "@/api/book";
import BookItem from "./components/book-item.vue";
import type { ApiSearchBookResult } from "@/api/types/book";

defineOptions({
  name: "book-search"
});

const searchValue = ref(""); // 模糊搜索值
const page = reactive({
  current: 1,
  size: 0,
  total: 0
});
const loading = ref(false);
const list = ref<ApiSearchBookResult["list"]>([]);

/**
 * @description: 处理模糊查询
 */
const handleSearch = () => {
  page.current = 1;
  page.size = 0;
  page.total = 0;
  getData();
};

/**
 * @description: 处理清除查询
 */
const handleClear = () => {
  list.value = [];
};

/**
 * @description: 获取页面数据
 */
const getData = async () => {
  loading.value = true;
  try {
    const res = await searchBook({ searchValue: searchValue.value, current: page.current });
    page.current = res.current;
    page.total = res.total;
    list.value.push(...res.list);
  } finally {
    loading.value = false;
  }
};

/**
 * @description: 处理滚动到底部
 */
const handleScrollToBottom = () => {
  if (!loading.value && page.current + 1 <= page.total / page.size) {
    page.current++;
    getData();
  }
};
</script>

<style lang="scss" scoped>
.book-search {
  height: 100%;
  display: flex;
  flex-direction: column;

  &__list {
    height: 0;
    flex-grow: 1;
  }
}
</style>
