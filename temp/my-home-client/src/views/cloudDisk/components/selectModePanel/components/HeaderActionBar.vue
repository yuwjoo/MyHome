<template>
  <div class="header-action-bar">
    <div class="header-action-bar-item">
      <div class="header-action-bar-item-cancel" @click="onCancel()">取消</div>
    </div>
    <div class="header-action-bar-item">
      <div class="header-action-bar-item-label">已选 {{ selectCount }} 项</div>
    </div>
    <div class="header-action-bar-item">
      <div v-show="!isAllSelect" class="header-action-bar-item-all-select" @click="allSelect()">全选</div>
      <div v-show="isAllSelect" class="header-action-bar-item-cancel-select" @click="cancelAllSelect()">取消全选</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { headerActionBarModels, headerActionBarProps } from "../define/props";

const props = defineProps(headerActionBarProps);

const selectFilePathList = defineModel(headerActionBarModels.modelValue); // 选择的文件路径列表
const selectCount = computed(() => selectFilePathList.value.length); // 选择的总数
const isAllSelect = computed(() => selectCount.value >= props.fileList.length); // 是否已全选

/**
 * 监听取消
 */
const onCancel = () => {
  selectFilePathList.value = [];
};

/**
 * 全选
 */
const allSelect = () => {
  selectFilePathList.value = props.fileList.map((item) => item.filePath);
};

/**
 * 取消全选
 */
const cancelAllSelect = () => {
  selectFilePathList.value = [];
};
</script>

<style lang="scss" scoped>
.header-action-bar {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 999;
  background-color: white;
  padding: 16px;
  box-sizing: border-box;
  width: 100%;
  height: 46px;
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;

  .header-action-bar-item {
    &:nth-of-type(2) {
      text-align: center;
    }

    &:nth-of-type(3) {
      text-align: right;
    }

    .header-action-bar-item-cancel,
    .header-action-bar-item-all-select,
    .header-action-bar-item-cancel-select {
      font-size: 14px;
    }

    .header-action-bar-item-label {
      color: #262626;
      font-size: var(--mh-title-text-size-sm);
    }

    .header-action-bar-item-all-select {
      font-size: 14px;
      color: #8b5cf6;
    }
  }
}
</style>
