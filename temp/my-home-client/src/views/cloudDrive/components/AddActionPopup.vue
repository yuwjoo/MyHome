<template>
  <van-popup v-model:show="show" position="bottom" round closeable teleport="body">
    <div class="add-action-popup">
      <div class="add-action-popup__title">选择操作</div>
      <div class="add-action-popup__list">
        <div class="add-action-popup__item" @click="onCreateFolder">
          <i-tabler:folder-plus class="add-action-popup__item-icon" />
          <div class="add-action-popup__item-label">创建文件夹</div>
        </div>
        <div class="add-action-popup__item" @click="onUploadFile">
          <i-tabler:upload class="add-action-popup__item-icon" />
          <div class="add-action-popup__item-label">上传文件</div>
        </div>
      </div>
      <div class="add-action-popup__cancel" @click="onCancel">取消</div>
    </div>
  </van-popup>
</template>

<script setup lang="ts">
const show = defineModel<boolean>("show", { default: false });
const emit = defineEmits<{
  "create-folder": [];
  "upload-file": [];
}>();

const onCreateFolder = () => {
  emit("create-folder");
};

const onUploadFile = () => {
  emit("upload-file");
};

const onCancel = () => {
  show.value = false;
};
</script>

<style lang="scss" scoped>
.add-action-popup {
  padding: 16px;

  &__title {
    font-size: 16px;
    color: #0f1724;
    text-align: center;
    margin-bottom: 8px;
  }

  &__list {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  &__item {
    background-color: #f5f7fb;
    border-radius: 12px;
    padding: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #111624;
    cursor: pointer;

    &-icon {
      font-size: 20px;
      margin-right: 8px;
      color: $theme-color;
    }

    &-label {
      font-size: 14px;
    }
  }

  &__cancel {
    margin-top: 12px;
    text-align: center;
    color: #a7aec0;
    font-size: 14px;
    padding: 12px 0;
  }
}
</style>
