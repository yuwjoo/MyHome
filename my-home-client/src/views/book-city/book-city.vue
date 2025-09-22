<template>
  <div class="book-city">
    <van-dropdown-menu class="book-city__dropdown dropdown-menu">
      <van-dropdown-item v-model="downMenuForm.classifyId" :options="bookClassifyList" @change="handleChangeClassify" />
      <van-dropdown-item
        :title="`第${listCurrentPage}页`"
        ref="searchDropdownItemRef"
        @open="handleOpenSearchDropdownItem"
      >
        <van-cell center title="当前页">
          <template #right-icon>
            <van-stepper
              v-model="downMenuForm.current"
              theme="round"
              integer
              min="1"
              :max="page.total"
              button-size="22"
            />
          </template>
        </van-cell>
        <van-cell center title="总页数" :value="countPage" />
        <div class="dropdown-menu__item-btn">
          <van-button type="primary" block round @click="handleSearchConfirm">跳转</van-button>
        </div>
      </van-dropdown-item>
    </van-dropdown-menu>

    <virtual-list
      class="book-city__list"
      :list="list"
      :min-item-size="200"
      :loading="loading"
      key-field="id"
      @scroll-to-bottom="handleScrollToBottom"
      @current-visible="handleCurrentVisibleChange"
    >
      <template #default="{ item, index }">
        <book-item :item="item" :index="index" />
      </template>
    </virtual-list>
  </div>
</template>

<script setup lang="ts">
import type { DropdownItemOption } from "vant";
import BookItem from "./components/book-item.vue";
import { getBookList, getBookClassifyList } from "@/api/book";
import type { BookListItem } from "./types/book-city";

defineOptions({
  name: "book-city"
});

const list = ref<BookListItem[]>([]); // 列表数据
const page = reactive({
  current: 1, // 当前页
  size: 0, // 每页条数
  total: 0 // 总条数
});
const loading = ref(false); // 加载中
const downMenuForm = reactive({
  classifyId: "0",
  current: 1
}); // 下拉筛选表单
const countPage = computed(() => page.total / page.size); // 总页数
const listCurrentPage = ref(1); // 当前列表展示页

const searchDropdownItemRef = useTemplateRef("searchDropdownItemRef"); // 筛选下拉框

const bookClassifyList = ref<DropdownItemOption[]>([{ text: "全部", value: "0" }]); // 分类列表

/**
 * @description: 获取分类列表
 */
const getBookClassifys = async () => {
  const res = await getBookClassifyList();
  bookClassifyList.value = res.map((item) => ({
    text: item.name,
    value: item.id
  }));
};

/**
 * @description: 获取页面数据
 */
const getList = async () => {
  try {
    loading.value = true;
    const res = await getBookList({
      current: page.current,
      classifyId: downMenuForm.classifyId
    });
    page.current = res.current;
    page.total = res.total;
    page.size = res.size;
    list.value.push(
      ...res.list.map((item, index) => {
        return { ...item, page, index };
      })
    );
  } finally {
    loading.value = false;
  }
};

/**
 * @description: 处理滚动到底部
 */
const handleScrollToBottom = () => {
  if (!loading.value && page.current + 1 <= countPage.value) {
    page.current++;
    getList();
  }
};

/**
 * @description: 处理列表当前展示项索引
 * @param {BookListItem} item item数据
 */
const handleCurrentVisibleChange = (item: BookListItem) => {
  if (!item) return;
  listCurrentPage.value = item.page.current;
};

/**
 * @description: 处理筛选下拉框打开
 */
const handleOpenSearchDropdownItem = () => {
  downMenuForm.current = listCurrentPage.value;
};

/**
 * @description: 处理筛选确认
 */
const handleSearchConfirm = () => {
  (searchDropdownItemRef.value as unknown as { toggle: () => void }).toggle();
  list.value = [];
  page.current = downMenuForm.current;
  getList();
};

/**
 * @description: 处理类型改变
 */
const handleChangeClassify = () => {
  list.value = [];
  page.current = 1;
  getList();
};

getBookClassifys();
getList();
</script>

<style lang="scss" scoped>
.book-city {
  height: 100%;
  display: flex;
  flex-direction: column;

  &__list {
    height: 0;
    flex-grow: 1;
  }
}

.dropdown-menu {
  &__item-btn {
    padding: 10px 16px;
  }
}
</style>
