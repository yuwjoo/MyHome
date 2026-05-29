<template>
  <base-card class="breadcrumb-card">
    <div v-for="(dir, index) in dirList" :key="index" class="breadcrumb-card__item" @click="changeDirPath(index)">
      <i-tabler:chevron-right v-if="index > 0" class="breadcrumb-card__item-separator" />
      <div class="breadcrumb-card__item-dirName">{{ dir }}</div>
    </div>
  </base-card>
</template>

<script setup lang="ts">
import BaseCard from "@/components-2/base/baseCard/BaseCard.vue";
import { breadcrumbCardModels } from "./define/props";
import type { BreadcrumbCardEmits } from "./define/emits";

const emits = defineEmits<BreadcrumbCardEmits>();

const dirPath = defineModel(breadcrumbCardModels.modelValue); // 目录路径
const dirList = computed(() => ["全部"].concat(dirPath.value.split("/").filter(Boolean))); // 目录列表

/**
 * 改变目录路径
 * @param index 下标
 */
const changeDirPath = (index: number) => {
  if (index === dirList.value.length - 1) return;
  dirPath.value = "/" + dirList.value.slice(1, index + 1).join("/");
  emits("change", dirPath.value);
};
</script>

<style lang="scss" scoped>
.breadcrumb-card {
  &.base-card {
    :deep(.base-card__body) {
      display: flex;
      align-items: center;
      box-sizing: border-box;
      overflow-x: auto;
      overflow-y: hidden;
    }
  }

  .breadcrumb-card__item {
    display: flex;
    align-items: center;
    font-size: 14px;
    color: #a3a3a3;
    flex-shrink: 0;

    &:last-of-type {
      color: #262626;
    }

    .breadcrumb-card__item-separator {
      margin: 0 4px;
    }
  }
}
</style>
