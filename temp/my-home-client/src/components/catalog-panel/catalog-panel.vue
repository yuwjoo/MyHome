<template>
  <div class="catalog-panel">
    <div class="catalog-panel__header">
      <div class="catalog-panel__header-title">目录</div>
      <div class="catalog-panel__header-sort" @click="isReverse = !isReverse">
        <van-icon name="sort" />
        {{ isReverse ? "正序" : "倒序" }}
      </div>
    </div>

    <div class="catalog-panel__content">
      <van-sidebar class="catalog-panel__sidebar" v-model="currentChapterGroupIndex">
        <van-sidebar-item v-for="(item, index) in chapterGroups" :key="index" :title="item.name" />
      </van-sidebar>

      <div class="catalog-panel__list">
        <div
          v-for="(item, index) in chapters"
          :key="index"
          class="catalog-panel__list-item"
          @click="handleClickChapter(item)"
        >
          {{ item.title }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from "vue";
import type { Chapter, ChapterGroup } from "./type";

defineOptions({
  name: "catalog-panel"
});

const emit = defineEmits<{
  change: [item: Chapter];
}>();

const props = defineProps({
  // 章节数据
  list: {
    type: Array as PropType<Chapter[]>,
    required: true
  },
  // 单个分组中章节数量
  groupCount: {
    type: Number,
    default: 50
  }
});

const isReverse = ref(false); // 是否倒序
const currentChapterGroupIndex = ref(0); // 当前选中章节分组下标
const chapterGroups = computed(() => {
  const gruops: ChapterGroup[] = [];
  let pos = -1;
  props.list.forEach((item, index) => {
    if (index % props.groupCount === 0) {
      pos++;
      gruops.push({
        name: `${pos * props.groupCount + 1}-${pos * props.groupCount + props.groupCount}`,
        chapters: []
      });
    }
    gruops[pos].chapters.push(item);
  });

  return isReverse.value ? gruops.reverse() : gruops;
}); // 当前章节分组数据
const chapters = computed(() => {
  const data = chapterGroups.value[currentChapterGroupIndex.value]?.chapters || [];
  return isReverse.value ? data.slice().reverse() : data;
}); // 当前章节数据

/**
 * @description: 处理点击章节
 * @param {Chapter} item 当前章节
 */
const handleClickChapter = (item: Chapter) => {
  emit("change", item);
};
</script>

<style lang="scss" scoped>
.catalog-panel {
  background: $font-color-ll;
  height: 100%;
  display: flex;
  flex-direction: column;

  &__header {
    margin-bottom: 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 40px;

    &-title {
      color: $font-color-dd;
      font-weight: 700;
      font-size: 16px;
    }

    &-sort {
      font-size: $font-size-medium;
      color: $font-color;
      margin-top: -1%;
    }
  }

  &__content {
    height: 0;
    flex-grow: 1;
    display: flex;
  }

  &__sidebar {
    --van-sidebar-width: 80px;
    --van-sidebar-padding: 12px 12px;
    height: 100%;
    flex-shrink: 0;
  }

  &__list {
    height: 100%;
    overflow: auto;
    padding-left: 10px;
    flex-grow: 1;

    &-item {
      line-height: 1.2;
      box-sizing: border-box;
      border-bottom: 1px solid $border-color;
      font-size: $font-size-medium;
      padding: 15px 0px;
      color: $font-color-dd;
    }
  }
}
</style>
