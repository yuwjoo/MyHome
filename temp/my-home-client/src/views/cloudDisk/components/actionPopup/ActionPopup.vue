<template>
  <base-popup class="add-popup" v-model:show="isVisible" title="请选择操作" height="180px" closeable>
    <div class="add-popup__option">
      <div class="add-popup__option-item" @click="openFileSelector()">
        <i-tabler:file-plus class="add-popup__option-item-icon" />
        <div class="add-popup__option-item-label">选择文件</div>
      </div>
      <div class="add-popup__option-item" @click="openFileSelector()">
        <i-tabler:photo-plus class="add-popup__option-item-icon" />
        <div class="add-popup__option-item-label">选择图片视频</div>
      </div>
      <div class="add-popup__option-item" @click="createFolder()">
        <i-tabler:folder-plus class="add-popup__option-item-icon" />
        <div class="add-popup__option-item-label">新建文件夹</div>
      </div>
    </div>
  </base-popup>

  <!-- 文件选择器 -->
  <file-selector ref="fileSelectorRef" @select="handleUploadFile" />
</template>

<script setup lang="ts">
import BasePopup from "@/components-2/base/basePopup/BasePopup.vue";
import FileSelector from "./components/FileSelector.vue";
import { useDialog } from "@/components-2/base/baseDialog/hooks/useDialog";
import { cloudDiskCreate } from "@/api/base";
import { actionPopupProps } from "./define/props";
import { closeToast, showLoadingToast } from "@node_modules/vant/lib";
import { uploadFile } from "../../utils/uploadFile";
import { usePopupControl } from "./hooks/usePopupControl";
import type { ActionPopupEmits } from "./define/emits";

const emits = defineEmits<ActionPopupEmits>();
const props = defineProps(actionPopupProps);

const { isVisible, open, close } = usePopupControl(); // 弹出层控制

const fileSelectorRef = useTemplateRef("fileSelectorRef"); // 文件选择器ref

/**
 * 打开文件选择器
 */
const openFileSelector = () => {
  fileSelectorRef.value?.openSelector();
};

/**
 * 处理上传文件
 * @param files 选择的文件列表
 */
const handleUploadFile = async (files: File[]) => {
  close();
  const file = files[0];
  if (!file) return;
  showLoadingToast({
    message: "上传中...",
    forbidClick: true
  });
  try {
    await uploadFile(file, props.dirPath + "/" + file.name);
    emits("change");
  } finally {
    closeToast();
  }
};

/**
 * 创建文件夹
 */
const createFolder = () => {
  close();
  const handle = async (dirPath: string) => {
    await cloudDiskCreate({
      path: dirPath,
      type: "directory"
    });
    emits("change");
  };
  useDialog().prompt({
    title: "新建文件夹",
    confirmButtonText: "创建",
    beforeClose: async (action, value) => {
      if (action !== "confirm") return;
      await handle(props.dirPath + "/" + value);
    }
  });
};

defineExpose({
  open,
  close
});
</script>

<style lang="scss" scoped>
.add-popup {
  .add-popup__option {
    display: flex;
    justify-content: center;
    align-items: flex-end;
    gap: 16px;
    box-sizing: border-box;
    padding-bottom: 16px;
    height: 100%;

    .add-popup__option-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      background-color: #f5f5f5;
      border-radius: 8px;
      padding: 16px;
      flex-grow: 1;
      color: #8b5cf6;

      .add-popup__option-item-icon {
        font-size: 30px;
      }

      .add-popup__option-item-label {
        font-size: 12px;
        margin-top: 8px;
      }
    }
  }
}

.file-input {
  display: none;
}
</style>
