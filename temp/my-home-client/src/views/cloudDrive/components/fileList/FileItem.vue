<template>
  <div
    v-if="listType === 'grid'"
    class="file-item-grid"
    @mousedown="onPressStart"
    @mouseup="onPressEnd"
    @mouseleave="onPressCancel"
    @touchstart.passive="onPressStart"
    @touchend.passive="onPressEnd"
    @touchmove.passive="onPressCancel"
    @contextmenu.prevent="onLongPress"
    @click="onItemClick"
  >
    <div class="file-item-grid__file">
      <CloudImage v-if="item.type === 'file' && item.imageInfo" class="file-item-grid__icon" :fileId="item.id" />
      <img v-else class="file-item-grid__icon" :src="fileIcon" alt="" />
    </div>
    <div class="file-item-grid__label text-ellipsis">{{ item.name }}</div>
  </div>
  <div
    v-else
    class="file-item--list"
    @mousedown="onPressStart"
    @mouseup="onPressEnd"
    @mouseleave="onPressCancel"
    @touchstart.passive="onPressStart"
    @touchend.passive="onPressEnd"
    @touchmove.passive="onPressCancel"
    @contextmenu.prevent="onLongPress"
    @click="onItemClick"
  >
    <img class="file-item-list__icon" :src="fileIcon" alt="" />
    <div class="file-item-list__content">
      <div class="file-item-list__content-label text-ellipsis">{{ item.name }}</div>
      <div class="file-item-list__content-update">{{ moment(item.updatedAt).format("YYYY-MM-DD hh:mm") }}</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { FileInfo } from "@/api/cloudDrive/interfaces";
import type { ListType } from "../actionBar.types";
import type { FileItemType } from "./fileList.types";
import { getFileIcon, getFolderIcon } from "./utils/fileIcons";
import moment from "moment";

const props = defineProps<{
  item: FileItemType; // 文件项数据
  listType: ListType; // 列表类型
}>();

const emit = defineEmits<{
  (e: "folder-click", item: FileInfo): void;
  (e: "file-click", item: FileInfo): void;
  (e: "long-press", item: FileInfo): void;
}>();

const fileSuffix = computed(() => props.item.name.match(/\.(.+)$/)?.[1] || ""); // 文件后缀
const fileIcon = computed(() => {
  return props.item.type === "directory" ? getFolderIcon() : getFileIcon(fileSuffix.value);
}); // 文件图标

/**
 * 点击文件项
 */
const onItemClick = () => {
  if (isLongPressed.value) {
    // 已经触发长按弹层时，阻止后续点击事件
    isLongPressed.value = false;
    return;
  }
  if (props.item.type === "directory") {
    emit("folder-click", props.item);
  } else {
    emit("file-click", props.item);
  }
};

// 长按相关状态
const pressTimer = ref<number | null>(null);
const isLongPressed = ref(false);
const LONG_PRESS_DELAY = 500;

const clearPressTimer = () => {
  if (pressTimer.value) {
    clearTimeout(pressTimer.value);
    pressTimer.value = null;
  }
};

const onPressStart = () => {
  isLongPressed.value = false;
  clearPressTimer();
  pressTimer.value = window.setTimeout(() => {
    onLongPress();
  }, LONG_PRESS_DELAY);
};

const onPressEnd = () => {
  clearPressTimer();
};

const onPressCancel = () => {
  clearPressTimer();
};

const onLongPress = () => {
  clearPressTimer();
  isLongPressed.value = true;
  emit("long-press", props.item);
};
</script>

<style lang="scss" scoped>
$icon-size: 40px; // 图标大小

.text-ellipsis {
  display: -webkit-box;
  -webkit-line-clamp: 2; /* 限制在一个块元素显示的文本的行数 */
  -webkit-box-orient: vertical; /* 设置或检索盒模型的子元素排列方式 */
  overflow: hidden; /* 隐藏超出部分的内容 */
  text-overflow: ellipsis; /* 当文本溢出时显示省略符号 */
}

.file-item-grid {
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  align-items: center;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f5f5f5;
  }

  &__file {
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #fafbfd;
    width: 100%;
    aspect-ratio: 4 / 3;
    border-radius: 8px;
  }

  &__icon {
    width: $icon-size;
    height: $icon-size;
  }

  &__label {
    margin-top: 12px;
    color: #0f1724;
    word-break: break-all;
    line-height: 1.2;
  }
}

.file-item--list {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f5f5f5;
  }

  &__icon {
    width: $icon-size;
    height: $icon-size;
    flex-shrink: 0;
  }

  &__content {
    min-height: 40px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: 0;
    flex-grow: 1;
    margin-left: 8px;

    &-label {
      color: #0f1724;
      word-break: break-all;
      line-height: 1.2;
    }
  }
}
</style>
