<template>
  <van-dialog v-model:show="isShow" :show-confirm-button="false">
    <div class="album-delete-dialog-body">
      <div class="album-delete-dialog-body__title">确定要删除《{{ albumData?.title }}》相册？</div>
      <van-button
        class="album-delete-dialog-body__btn album-delete-dialog-body__confirm"
        type="danger"
        @click="handleClickConfirm"
      >
        删除
      </van-button>
      <van-button class="album-delete-dialog-body__btn album-delete-dialog-body__cancel" @click="closeDialog">
        取消
      </van-button>
    </div>
  </van-dialog>
</template>

<script setup lang="ts">
import type { AlbumListItem } from "../types/albumList";

const emit = defineEmits<{
  delete: [albumData: AlbumListItem];
}>();
const isShow = ref(false); // 显示对话框
const albumData = ref<AlbumListItem>(); // 相册数据

/**
 * 打开对话框
 * @param album 相册数据
 */
const openDialog = (album: AlbumListItem) => {
  albumData.value = album;
  isShow.value = true;
};

/**
 * 关闭对话框
 */
const closeDialog = () => {
  isShow.value = false;
};

/**
 * 处理点击确定
 */
const handleClickConfirm = () => {
  emit("delete", albumData.value!);
  closeDialog();
};

defineExpose({ openDialog, closeDialog });
</script>

<style lang="scss" scoped>
.album-delete-dialog-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 10px;

  &__title {
    font-size: 20px;
    color: $font-color-dd;
  }

  &__input {
    border: none;
    background-color: $background-color-mm;
    margin-top: 40px;
    padding: 20px 15px;
    border-radius: 8px;
    width: 100%;
    box-sizing: border-box;
  }

  &__btn {
    width: 90%;
    border: none;
    font-size: 16px;
    padding: 25px 0;
  }

  &__confirm {
    margin-top: 50px;
  }

  &__cancel {
    margin-top: 20px;
  }
}
</style>
