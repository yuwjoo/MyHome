<template>
  <van-popup v-model:show="show" position="bottom" round closeable teleport="body">
    <div class="create-folder-popup">
      <div class="create-folder-popup__title">创建文件夹</div>
      <van-field v-model="folderName" label="名称" placeholder="请输入文件夹名称" clearable />
      <div class="create-folder-popup__actions">
        <van-button type="primary" block @click="onConfirm">确定</van-button>
      </div>
    </div>
  </van-popup>
</template>

<script setup lang="ts">
const show = defineModel<boolean>("show", { default: false });
const emit = defineEmits<{
  confirm: [folderName: string];
}>();

const folderName = ref("");

const onConfirm = () => {
  emit("confirm", folderName.value);
  folderName.value = "";
};
</script>

<style lang="scss" scoped>
.create-folder-popup {
  padding: 16px;

  &__title {
    font-size: 16px;
    color: #0f1724;
    text-align: center;
    margin-bottom: 8px;
  }

  &__actions {
    margin-top: 16px;
  }
}
</style>
