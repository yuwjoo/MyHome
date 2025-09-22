<template>
  <div class="book-read" ref="bookReadRef" @click="showSetting = !showSetting">
    <virtual-list
      class="book-read__list"
      :list="list"
      :min-item-size="200"
      :loading="loading"
      key-field="chapterId"
      @scroll-to-bottom="handleScrollToBottom"
    >
      <template #default="{ item, index }">
        <book-item :item="item" :index="index" />
      </template>
    </virtual-list>

    <div v-if="showCatalogPlan" class="book-read__catalog" @click.stop>
      <div class="book-read__catalog-header">
        <i class="book-read__catalog-header-back icon-back" @click="showCatalogPlan = false"></i>
        <span class="book-read__catalog-header-label">返回</span>
      </div>
      <catalog-panel class="book-read__catalog-panel" :list="chapters" @change="handleClickChapter" />
    </div>
  </div>

  <setting-btn :showFlag="showSetting" @openChapters="openChapters" @back="back" />
</template>

<script setup lang="ts">
import { useRoute, useRouter } from "@/router";
import { getBookContent, getBookAllChapterList } from "@/api/book";
import BookItem from "./components/book-item.vue";
import SettingBtn from "./components/setting-btn.vue";
import type { ApiGetBookContentResult, ApiGetBookAllChapterListResult } from "@/api/types/book";
import type { Chapter } from "@/components/catalog-panel/type";
import { useBook } from "@/store/book";

defineOptions({
  name: "book-read"
});

const route = useRoute();
const router = useRouter();

const bookStore = useBook();

const bookReadRef = useTemplateRef("bookReadRef");

const list = ref<ApiGetBookContentResult[]>([]); // 列表数据
const loading = ref(false); // 加载中
const chapters = ref<ApiGetBookAllChapterListResult>([]); // 章节数据
const nextChapterId = computed(() => list.value[list.value.length - 1].nextChapterId); // 下一章id

const showCatalogPlan = ref(false); // 显示章节面板
const showSetting = ref(false);

// 打开章节面板
const openChapters = () => {
  showSetting.value = false;
  showCatalogPlan.value = true;
};

// 返回
const back = () => {
  router.back();
};

/**
 * @description: 获取页面数据
 * @param {string} chapterId 章节id
 */
const getList = async (chapterId: string) => {
  try {
    loading.value = true;
    const res = await getBookContent({
      id: route.query.id as string,
      chapterId
    });
    list.value.push(res);
  } finally {
    loading.value = false;
  }
};

/**
 * @description: 获取章节数据
 */
const getChapterData = async () => {
  chapters.value = await getBookAllChapterList({ id: route.query.id as string });
};

/**
 * @description: 处理滚动到底部
 */
const handleScrollToBottom = () => {
  if (!loading.value && nextChapterId.value) {
    getList(nextChapterId.value);
  }
};

/**
 * @description: 处理点击章节
 * @param {Chapter} item 章节数据
 */
const handleClickChapter = (item: Chapter) => {
  list.value = [];
  getList(item.id);
  showCatalogPlan.value = false;
  showSetting.value = false;
};

getList(route.query.chapterId as string);
getChapterData();

onMounted(() => {
  watchEffect(() => {
    if (!bookReadRef.value) return;
    const currentMode = bookStore.currentMode;
    bookReadRef.value.style.setProperty("--book-read-bg", currentMode.bg);
    bookReadRef.value.style.setProperty("--book-read-color", currentMode.color);
    bookReadRef.value.style.setProperty("--book-read-title-color", bookStore.settings.isNight ? currentMode.color : "");
    bookReadRef.value.style.setProperty("--book-read-font-size-scale", currentMode.fontSizeScale + "px");
  });
});
</script>

<style lang="scss" scoped>
.book-read {
  height: 100%;
  background-color: var(--book-read-bg);

  &__list {
    margin: 0 10px;
    height: 100%;
  }

  &__catalog {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    z-index: 999;
    padding: 0 10px;
    background-color: white;
    display: flex;
    flex-direction: column;

    &-header {
      height: 44px;
      line-height: 44px;

      &-back {
        display: inline-block;
        width: 32px;
        height: 100%;
        font-size: 20px;
        text-align: center;
      }
    }

    &-panel {
      flex-grow: 1;
      height: 0;
    }
  }
}
</style>
