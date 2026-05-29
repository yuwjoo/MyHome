<template>
  <div
    class="file-list"
    :class="{
      'file-list--grid': listType === 'grid',
      'file-list--list': listType === 'list'
    }"
  >
    <FileItem
      v-for="item in fileList"
      :key="item.id"
      class="file-list__item"
      :item="item"
      :list-type="listType"
      @folder-click="onFolderClick"
      @file-click="onFileClick"
      @long-press="onLongPress"
    />
  </div>
</template>

<script lang="ts" setup>
import type { FileInfo } from "@/api/cloudDrive/interfaces";
import type { ListType } from "../actionBar.types";
import FileItem from "./FileItem.vue";
import type { FileItemType } from "./fileList.types";

defineProps<{
  fileList: FileItemType[]; // 文件列表
  listType: ListType; // 列表类型
}>();

const emit = defineEmits<{
  (e: "folder-click", item: FileInfo): void;
  (e: "file-click", item: FileInfo): void;
  (e: "long-press", item: FileInfo): void;
}>();

/**
 * 点击文件夹
 */
const onFolderClick = (item: FileInfo) => {
  emit("folder-click", item);
};

/**
 * 点击文件
 */
const onFileClick = (item: FileInfo) => {
  emit("file-click", item);
};

/**
 * 长按文件/文件夹
 */
const onLongPress = (item: FileInfo) => {
  emit("long-press", item);
};
</script>

<style lang="scss" scoped>
.file-list {
  &--grid {
    margin: 0 8px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }

  &--list {
    margin: 0 12px;
  }
}
</style>
