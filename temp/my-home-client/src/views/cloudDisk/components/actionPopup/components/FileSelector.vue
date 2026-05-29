<template>
  <input class="file-selector-file" ref="fileInput" type="file" @change="onSelectFile" />
</template>

<script lang="ts" setup>
import type { FileSelectorEmits } from "../define/emits";

const emit = defineEmits<FileSelectorEmits>();

const fileInputRef = useTemplateRef("fileInput"); // 文件input ref

/**
 * 监听选择文件
 */
const onSelectFile = async (ev: Event) => {
  const target = ev.target as HTMLInputElement;
  const files = [...(target.files || [])];

  emit("select", files);

  target.value = "";
};

/**
 * 打开文件选择器
 */
const openSelector = () => {
  fileInputRef.value?.click();
};

defineExpose({
  openSelector
});
</script>

<style lang="scss" scoped>
.file-selector-file {
  display: none;
}
</style>
