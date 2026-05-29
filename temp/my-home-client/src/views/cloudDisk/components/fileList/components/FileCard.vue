<template>
  <div class="file-card">
    <van-image class="file-card__icon" :src="fileIcon" fit="cover" />
    <div class="file-card__name">{{ props.fileItem.fileName }}</div>
    <div class="file-card__updateDate">{{ updateDate }}</div>
    <slot name="footer"></slot>
  </div>
</template>

<script setup lang="ts">
import moment from "moment";
import { fileCardProps } from "../define/props";
import { getFileIcon } from "../../../utils/fileItem";
import type { FileCardSlots } from "../define/slots";

defineSlots<FileCardSlots>();

const props = defineProps(fileCardProps);

const fileIcon = computed(() => getFileIcon(props.fileItem.fileType, props.fileItem.fileName)); // 文件项图标
const updateDate = moment(props.fileItem.updatedTime).format("YYYY/MM/DD HH:mm"); // 文件项更新时间
</script>

<style lang="scss" scoped>
.file-card {
  display: flex;
  flex-direction: column;
  align-items: center;

  .file-card__icon {
    width: 60px;
    height: 60px;
  }

  .file-card__name {
    color: #262626;
    display: -webkit-box;
    line-clamp: 2;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 14px;
    flex-grow: 1;
    word-break: break-all;
  }

  .file-card__updateDate {
    font-size: 12px;
    color: #a1a1aa;
    margin-top: 4px;
  }
}
</style>
