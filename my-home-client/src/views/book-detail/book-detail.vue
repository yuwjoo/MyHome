<template>
  <div class="book-detail">
    <div class="book-detail__header">
      <i class="book-detail__header-back icon-back" @click="handleBack"></i>
      <div class="book-detail__header-bg" :style="bgImgStyle"></div>
    </div>
    <div class="book-detail__bg" :style="bgImgStyle"></div>

    <div class="book-detail__content">
      <div class="book-detail__primary">
        <img class="book-detail__cover" :src="bookInfo.cover" />
        <div class="book-detail__info">
          <h1 class="book-detail__info-title">{{ bookInfo.title }}</h1>
          <p class="book-detail__info-author">作者：{{ bookInfo.author.name }}</p>
          <p class="book-detail__info-category">类型：{{ bookInfo.classify.name }}</p>
        </div>
      </div>
      <div class="book-detail__secondary">
        <h1 class="book-detail__secondary-title">简介</h1>
        <p class="book-detail__secondary-intro">{{ bookInfo.intro }}</p>
        <div class="book-detail__secondary-other">
          <span class="book-detail__secondary-latest">最新 {{ bookInfo.lastChapter.title }}</span>
          <span class="book-detail__secondary-update">{{ bookInfo.updateDate }}</span>
        </div>
      </div>

      <div class="book-detail__catalog-panel">
        <catalog-panel :list="chapters" @change="handleClickChapter" />
      </div>
    </div>

    <van-overlay :show="loading">
      <div class="loading-wrapper">
        <van-loading size="24px" vertical>加载中...</van-loading>
      </div>
    </van-overlay>
  </div>
</template>

<script setup lang="ts">
import { getBookAllChapterList, getBookDetail } from "@/api/book";
import type { ApiGetBookDetailResult, ApiGetBookAllChapterListResult } from "@/api/types/book";
import type { Chapter } from "@/components/catalog-panel/type";
import { useRoute, useRouter } from "@/router";

defineOptions({
  name: "book-detail"
});

const route = useRoute();
const router = useRouter();

const loading = ref(false); // 加载中

const bookInfo = ref<ApiGetBookDetailResult>({
  id: "",
  title: "",
  cover: "",
  intro: "",
  author: {
    id: "",
    name: ""
  },
  classify: {
    id: "",
    name: ""
  },
  updateDate: "",
  lastChapter: {
    id: "",
    title: "",
    isLock: false
  },
  state: -1
}); // 小说信息
const chapters = ref<ApiGetBookAllChapterListResult>([]); // 章节数据

const bgImgStyle = computed(() => ({
  backgroundImage: `url(${bookInfo.value.cover})`
})); // 背景图片样式

/**
 * @description: 处理后退
 */
const handleBack = () => {
  router.back();
};

/**
 * @description: 获取页面数据
 */
const getData = async () => {
  loading.value = true;
  try {
    const [detailRes, chapterRes] = await Promise.all([
      getBookDetail({ id: route.query.id as string }),
      getBookAllChapterList({ id: route.query.id as string })
    ]);
    bookInfo.value = detailRes;
    chapters.value = chapterRes;
  } finally {
    loading.value = false;
  }
};

/**
 * @description: 处理点击章节
 * @param {Chapter} item 章节数据
 */
const handleClickChapter = (item: Chapter) => {
  router.push({
    name: "book-read",
    query: { id: route.query.id, chapterId: item.id }
  });
};

getData();

onActivated(() => {
  if (route.query.id !== bookInfo.value.id) {
    getData();
  }
});
</script>

<style lang="scss" scoped>
.book-detail__header {
  position: fixed;
  top: 0;
  z-index: 1;
  width: 100%;
  height: 44px;
  line-height: 44px;
  color: $background-color;

  .book-detail__header-bg {
    position: absolute;
    top: 0;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-repeat: no-repeat;
    filter: blur(8px) brightness(0.8);
    transform-origin: top;
    z-index: -1;
  }
  .book-detail__header-back {
    display: inline-block;
    width: 32px;
    height: 100%;
    font-size: 20px;
    text-align: center;
  }
}

.book-detail__bg {
  position: absolute;
  top: 0;
  width: 100%;
  height: 184px;
  left: 0;
  background-size: cover;
  background-repeat: no-repeat;
  filter: blur(8px) brightness(0.8);
  transform-origin: top;
  z-index: -998;
}

.book-detail__content {
  padding-top: 44px;

  .book-detail__primary {
    height: 140px;
    box-sizing: border-box;
    padding: 14px 16px;
    display: flex;

    .book-detail__cover {
      height: 100%;
      width: 85px;
      margin-right: 26px;
    }

    .book-detail__info {
      color: $background-color;
      flex: 1;
      display: flex;
      flex-direction: column;
      font-size: $font-size-medium;

      .book-detail__info-title {
        font-size: $font-size-medium-x;
        width: 100%;
        margin-bottom: 8px;
        line-height: 1.2;
      }
    }
  }

  .book-detail__secondary {
    padding: 0 16px;
    background: $background-color;
    margin-bottom: 14px;

    .book-detail__secondary-title {
      font-size: $font-size-medium-x;
      color: $font-color-dd;
      line-height: 40px;
    }

    .book-detail__secondary-intro {
      font-size: $font-size-medium;
      line-height: 20px;
      margin-bottom: 20px;
      color: $font-color-d;
    }

    .book-detail__secondary-other {
      border-top: 1px solid $border-color;
      height: 40px;
      line-height: 40px;
      display: flex;

      .book-detail__secondary-latest {
        flex: 1;
        font-size: $font-size-medium;
        color: $font-color-dd;
      }

      .book-detail__secondary-update {
        font-size: $font-size-small;
      }
    }
  }

  .book-detail__catalog-panel {
    padding: 0 16px;
    height: calc(70vh);
    background: $font-color-ll;
  }
}

.loading-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}
</style>
