<!--
  @file 路径输入组件
  @description 
-->
<template>
  <el-input
    class="path-input"
    v-model="path"
    :placeholder="placeholder"
    :disabled="disabled"
    :readonly="!editable"
    :clearable="clearable"
    @blur="handleBlur"
  >
    <!-- 父路径展示区 -->
    <template v-if="!!parentPath" #prepend>
      <input
        class="path-input__parent"
        :value="parentPath"
        :title="parentPath"
        readonly
        tabindex="-1"
      />
    </template>

    <!-- 选择文件按钮 -->
    <template v-if="!disabled && allowFilePicker" #append>
      <el-button :icon="Folder" @click="handlePick">选择</el-button>
    </template>
  </el-input>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Folder } from '@element-plus/icons-vue'
import { electronApi } from '@renderer/utils/electronApi'
import { pathInputProps } from './defines/props'
import type { TPathInputEmits } from './types/defines'

defineOptions({
  name: 'pathInput'
})

const emit = defineEmits<TPathInputEmits>()

const props = defineProps(pathInputProps)
// 路径
const path = defineModel('path', pathInputProps.path)

// 完整路径
const fullPath = ref('')

/**
 * 更新完整路径
 * @returns 更新完成的 Promise
 */
async function updateFullPath(): Promise<void> {
  const oldFullPath = fullPath.value
  const newFullPath = await getFullPath()

  if (newFullPath === oldFullPath) return
  fullPath.value = newFullPath
  emit('full-path-change', fullPath.value)
}

/**
 * 获取完整路径
 * @returns 完整路径
 */
async function getFullPath(): Promise<string> {
  if (!path.value) return ''
  return electronApi.path.join(props.separatorPlatform, props.parentPath, path.value)
}

/**
 * 处理输入框失焦
 * @returns 处理完成的 Promise
 */
async function handleBlur(): Promise<void> {
  await updateFullPath()
}

/**
 * 处理文件选择
 * @returns 选择完成的 Promise
 */
async function handlePick(): Promise<void> {
  const [picked] = await electronApi.dialog.openFilePicker({
    selectDirectory: props.pickerTarget === 'directory',
    defaultPath: props.pickerDefaultPath
  })
  if (!picked || !picked.startsWith(props.parentPath)) return
  if (props.parentPath) {
    path.value = await electronApi.path.relative(props.separatorPlatform, props.parentPath, picked)
  } else {
    path.value = picked
  }
  await updateFullPath()
}

defineExpose({
  getFullPath
})
</script>

<style scoped lang="scss">
.path-input {
  /* 父路径可能很长：内容超宽时靠原生拖动横向查看，不做省略、不显示滚动条 */
  &__parent {
    max-width: 180px;
    padding: 0;
    color: var(--el-text-color-secondary);
    vertical-align: middle;
    /* 按内容宽度自适应，短路径不占多余空间 */
    field-sizing: content;
    background: transparent;
    border: none;
    outline: none;
    caret-color: transparent;
    cursor: grab;
    /* 隐藏滚动条，滚动能力保留 */
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }

    &::selection {
      /* 拖动查看时抹掉选中高亮，避免误以为在做文本操作 */
      background: transparent;
    }

    &:active {
      cursor: grabbing;
    }
  }
}
</style>
