<template>
  <van-dialog v-model:show="isShow" :show-confirm-button="false">
    <div class="album-edit-dialog-body">
      <div class="album-edit-dialog-body__title">{{ dialogType === "add" ? "新建" : "重命名" }}相册</div>
      <input
        class="album-edit-dialog-body__input"
        v-model="albumData!.title"
        placeholder="请输入相册名称"
        @change="handleInputChange"
      />
      <van-button
        class="album-edit-dialog-body__btn album-edit-dialog-body__confirm"
        type="primary"
        @click="handleClickConfirm"
      >
        确定
      </van-button>
      <van-button class="album-edit-dialog-body__btn album-edit-dialog-body__cancel" @click="closeDialog">
        取消
      </van-button>
    </div>
  </van-dialog>
</template>

<script setup lang="ts">
import type { AlbumDataForm, DialogTyep } from "../types/albumEditDialog";
import type { AlbumListItem } from "../types/albumList";

const emit = defineEmits<{
  add: [albumData: AlbumDataForm];
  edit: [albumData: AlbumDataForm];
}>();
const isShow = ref(false); // 显示对话框
const dialogType = ref<DialogTyep>("add"); // 对话框类型
const albumData = ref<AlbumDataForm>(); // 相册名称

/**
 * 打开对话框
 * @param type 对话框类型
 * @param albumData 相册数据
 */
const openDialog = (type: DialogTyep, album?: AlbumListItem) => {
  dialogType.value = type;
  albumData.value = album || { title: "" };
  isShow.value = true;
};

/**
 * 关闭对话框
 */
const closeDialog = () => {
  isShow.value = false;
};

/**
 * 处理输入框内容改变
 */
const handleInputChange = () => {
  albumData.value!.title = albumData.value!.title.trim();
};

/**
 * 处理点击确定
 */
const handleClickConfirm = () => {
  if (albumData.value!.title === "") {
    showToast({
      message: "请输入相册名称"
    });
    return;
  }
  dialogType.value === "add" ? emit("add", albumData.value!) : emit("edit", albumData.value!);
  closeDialog();
};

defineExpose({ openDialog, closeDialog });
</script>

<style lang="scss" scoped>
.album-edit-dialog-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 20px;

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
