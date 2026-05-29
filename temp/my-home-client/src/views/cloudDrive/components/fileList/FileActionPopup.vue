<template>
  <van-popup class="file-action-popup" v-model:show="innerShow" round position="bottom">
    <div class="file-action-popup__title">{{ file?.name || "文件操作" }}</div>
    <van-cell clickable @click="handleAction('rename')">
      <div class="file-action-popup__cell-text">重命名</div>
    </van-cell>
    <van-cell clickable @click="handleAction('move')">
      <div class="file-action-popup__cell-text">移动</div>
    </van-cell>
    <van-cell class="file-action-popup__delete" clickable @click="handleAction('delete')">
      <div class="file-action-popup__cell-text">删除</div>
    </van-cell>
  </van-popup>
</template>

<script setup lang="ts">
import type { FileInfo } from "@/api/cloudDrive/interfaces";

const props = defineProps<{
  show: boolean;
  file?: FileInfo | null;
}>();

const emit = defineEmits<{
  (e: "update:show", val: boolean): void;
  (e: "rename"): void;
  (e: "delete"): void;
  (e: "move"): void;
}>();

const innerShow = computed({
  get: () => props.show,
  set: (val) => emit("update:show", val)
});

const handleAction = (type: "rename" | "delete" | "move") => {
  emit(type as any);
  emit("update:show", false);
};
</script>

<style lang="scss" scoped>
.file-action-popup {
  padding: 8px 0 16px;

  &__title {
    text-align: center;
    padding: 6px 0 10px;
    color: #666;
    font-size: 14px;
  }

  &__cell-text {
    text-align: center;
    font-size: 16px;
    padding: 12px 0;
    color: #323233;
  }

  &__delete {
    border-top: 8px solid #f7f8fa;

    .file-action-popup__cell-text {
      color: #ee0a24;
    }
  }
}
</style>
