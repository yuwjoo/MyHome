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
    @change="handleInputChange"
  >
    <!-- 父路径展示区 -->
    <template v-if="showParent" #prepend>
      <input
        class="path-input__parent"
        :value="parentPath"
        :title="parentPath"
        readonly
        tabindex="-1"
      />
    </template>

    <!-- 选择文件按钮 -->
    <template v-if="showPicker" #append>
      <el-button :icon="Folder" :disabled="disabled" @click="handlePick">
        {{ pickerButtonText }}
      </el-button>
    </template>
  </el-input>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { Folder } from '@element-plus/icons-vue'
import { electronApi } from '@renderer/utils/electronApi'
import { pathInputProps } from './common/props'
import type { TPathInputEmits } from './types/defines'

defineOptions({ name: 'pathInput' })

const props = defineProps(pathInputProps)
const emit = defineEmits<TPathInputEmits>()

// 路径
const path = defineModel('path', pathInputProps.path)

// 路径分隔符
const pathSeparator = ref(props.separator || '/')
watchEffect(async () => {
  pathSeparator.value = props.separator || (await electronApi.path.sep())
})

// 完整路径
const fullPath = computed(() => {
  // 去掉开头的 ./ 与多余分隔符，再与父路径拼接
  const inputPath = path.value.replace(/^\.[\\/]/, '').replace(/^[\\/]+/, '')
  // 输入为空、本身是绝对路径、或没有父路径时，都不以父路径为基准拼接
  if (!inputPath || !props.parentPath || isAbsolutePath(inputPath)) return inputPath
  const joined = `${props.parentPath.replace(/[\\/]+$/, '')}${pathSeparator.value}${inputPath}`
  return unifySeparator(joined, pathSeparator.value)
})

/**
 * 判断是否为绝对路径
 * @param value 待判断的路径
 * @returns posix 根路径或 Windows 盘符路径时为 true
 */
function isAbsolutePath(value: string): boolean {
  return /^\//.test(value) || /^[a-zA-Z]:[\\/]/.test(value)
}

/**
 * 把路径里的分隔符统一成指定分隔符
 * @param value 路径
 * @param separator 目标分隔符
 * @returns 分隔符统一后的路径
 */
function unifySeparator(value: string, separator: string): string {
  return separator === '/' ? value.replace(/\\/g, '/') : value.replace(/\//g, '\\')
}

// 显示父路径区域
const showParent = computed(() => props.showParentPath && !!props.parentPath)

/**
 * 拉起系统选择框并把选到的路径回填
 *
 * 取消选择得到空数组，此时保持原值不动
 * @returns 选择完成的 Promise
 */
async function handlePick(): Promise<void> {
  const [picked] = await electronApi.dialog.openFilePicker({
    selectDirectory: props.pickerMode === 'directory',
    defaultPath: props.pickerDefaultPath
  })
  if (picked) await commitFullPath(picked)
}

/**
 * 由完整路径换算输入框中的路径
 *
 * 完整路径在父路径下时取相对部分；不在父路径下（回退到上层或跨盘符）时以 ./ 带上完整路径；
 * 没有父路径时输入框中的路径就是完整路径
 * @param fullPath 完整路径
 * @param parentPath 父路径
 * @returns 输入框中的路径
 */
async function toInputPath(fullPath: string, parentPath: string): Promise<string> {
  if (!fullPath) return ''
  if (!parentPath) return fullPath
  const relativePath = await electronApi.path.relative(parentPath, fullPath)
  // 需要回退到上层、或换算结果本身是绝对路径（跨盘符），都说明完整路径不在父路径下
  if (relativePath.startsWith('..') || (await electronApi.path.isAbsolute(relativePath))) {
    return `./${fullPath}`
  }
  return relativePath
}

/**
 * 以完整路径为准回填：通常是文件选择器选中的路径
 * @param value 选中的完整路径
 */
async function commitFullPath(value: string): Promise<void> {
  path.value = await toInputPath(value, props.parentPath)
  emit('change', path.value, fullPath.value)
}

/**
 * 处理输入框内容变化：完整路径已由计算属性派生，这里只负责抛出 change
 * @param value 输入框的最新内容
 */
function handleInputChange(value: string): void {
  emit('change', value, fullPath.value)
}
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
