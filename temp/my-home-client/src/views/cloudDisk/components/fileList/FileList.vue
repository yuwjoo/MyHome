<template>
  <div class="file-list">
    <base-list class="file-list__list" ref="baseListRef" v-model="fileItemList" :load-fun="loadList" disabled-load>
      <van-checkbox-group class="file-list__list-item" v-model="checkedFilePathList">
        <file-card
          v-for="(fileItem, index) in fileItemList"
          :key="index"
          :file-item="fileItem"
          @click="handleClickFileItem(fileItem)"
        >
          <template #footer>
            <van-checkbox
              class="file-list__list-item-checkbox"
              :name="fileItem.filePath"
              checked-color="#8b5cf6"
              @click.stop
            />
          </template>
        </file-card>
      </van-checkbox-group>
    </base-list>

    <!-- 选择模式面板 -->
    <select-mode-panel v-model="checkedFilePathList" :file-list="fileItemList" />
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "@/router";
import BaseList from "@/components-2/base/baseList/BaseList.vue";
import type { LoadFun } from "@/components-2/base/baseList/types";
import { cloudDiskGetList } from "@/api/base";
import type { FileListEmits } from "./define/emits";
import { fileListProps } from "./define/props";
import FileCard from "./components/FileCard.vue";
import type { FileItem } from "../../types/fileItem";
import SelectModePanel from "../selectModePanel/SelectModePanel.vue";

const emits = defineEmits<FileListEmits>();
const props = defineProps(fileListProps);

const baseListRef = useTemplateRef("baseListRef"); // 基础列表 ref
const fileItemList = ref<FileItem[]>([]); // 文件项列表
const checkedFilePathList = ref<string[]>([]); // 选中的文件路径列表
const isSelect = computed(() => !!checkedFilePathList.value.length); // 是否选择

/**
 * 加载列表数据
 */
const loadList: LoadFun = async () => {
  const res = await cloudDiskGetList({
    parentPath: props.modelValue
  });
  return { datas: res.data.data };
};

/**
 * 监听目录路径变化，重置数据
 */
watch(
  () => props.modelValue,
  () => {
    baseListRef.value?.resetData();
  }
);

/**
 * 重置数据
 */
const resetData = () => {
  baseListRef.value?.resetData();
};

/**
 * 处理点击文件项
 */
const handleClickFileItem = (fileItem: FileItem) => {
  if (isSelect.value) {
    if (checkedFilePathList.value.some((item) => item === fileItem.filePath)) {
      checkedFilePathList.value = checkedFilePathList.value.filter((item) => item !== fileItem.filePath);
    } else {
      checkedFilePathList.value.push(fileItem.filePath);
    }
  } else if (fileItem.fileType === "directory") {
    emits("update:modelValue", fileItem.filePath);
  } else {
    useRouter().push({ name: "cloudDiskFileDetails", query: { path: fileItem.filePath } });
  }
};

defineExpose({
  resetData
});
</script>

<style lang="scss" scoped>
.file-list {
  min-height: 400px;

  .file-list__list {
    margin-top: 4px;
    height: 100%;

    .file-list__list-item {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;

      .file-list__list-item-checkbox {
        --van-checkbox-size: 16px;
        padding: 4px 0;
        width: 100%;
        display: flex;
        justify-content: center;
      }
    }
  }
}
</style>
