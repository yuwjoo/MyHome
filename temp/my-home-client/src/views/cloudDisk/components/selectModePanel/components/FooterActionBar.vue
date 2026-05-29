<template>
  <div class="footer-action-bar">
    <div class="footer-action-bar-item">
      <i-tabler:download class="footer-action-bar-item-icon" />
      <div class="footer-action-bar-item-label">下载</div>
    </div>
    <div v-show="!isMultipleSelect" class="footer-action-bar-item">
      <i-tabler:receipt class="footer-action-bar-item-icon" />
      <div class="footer-action-bar-item-label">重命名</div>
    </div>
    <div class="footer-action-bar-item">
      <i-tabler:arrow-move-right class="footer-action-bar-item-icon" />
      <div class="footer-action-bar-item-label">移动</div>
    </div>
    <div class="footer-action-bar-item is-danger" @click="deleteFile()">
      <i-tabler:trash class="footer-action-bar-item-icon" />
      <div class="footer-action-bar-item-label">删除</div>
    </div>
    <div v-show="!isMultipleSelect" class="footer-action-bar-item">
      <i-tabler:file-info class="footer-action-bar-item-icon" />
      <div class="footer-action-bar-item-label">查看详情</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { showConfirmDialog } from "@node_modules/vant/lib";
import { footerActionBarModels } from "../define/props";
import { cloudDiskDelete } from "@/api/base";

const selectFilePathList = defineModel(footerActionBarModels.modelValue); // 选择的文件路径列表
const isMultipleSelect = computed(() => selectFilePathList.value.length > 1); // 是否选择了多个

/**
 * 删除文件
 */
const deleteFile = async () => {
  await showConfirmDialog({
    title: "删除",
    message: "确认是否删除所选文件项"
  });

  const requests: Promise<any>[] = [];

  for (const filePath of selectFilePathList.value) {
    requests.push(cloudDiskDelete({ path: filePath }));
  }

  await Promise.all(requests);
};
</script>

<style lang="scss" scoped>
.footer-action-bar {
  position: fixed;
  bottom: 16px;
  left: 0;
  right: 0;
  margin: auto;
  z-index: 999;
  background-color: white;
  padding: 16px;
  box-sizing: border-box;
  width: calc(100% - 32px);
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  border-radius: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  color: #262626;

  .footer-action-bar-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-grow: 1;

    .footer-action-bar-item-icon {
      font-size: 18px;
    }

    .footer-action-bar-item-label {
      font-size: 12px;
      margin-top: 8px;
    }
  }
}
</style>
