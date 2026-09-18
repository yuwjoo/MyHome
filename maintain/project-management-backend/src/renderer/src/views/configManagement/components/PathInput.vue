<!--
  @file 路径输入组件
  @description 路径录入：中间输入框，左侧可挂根路径展示，右侧可挂选择按钮（拉起系统选择框取本地绝对路径）；
  用这两个可选部分组合出各类填写形态 —— 本地绝对路径（输入框 + 选择）、本地相对路径（根路径 + 输入框）、
  OSS 路径（仅输入框）、OSS 相对路径（根路径 + 输入框）
-->
<script setup lang="ts">
import { computed } from 'vue'
import { Folder } from '@element-plus/icons-vue'
import { openFilePicker } from '@renderer/utils/filePicker'

defineOptions({ name: 'pathInput' })

/**
 * 组件属性
 */
const props = withDefaults(
  defineProps<{
    /** 输入框中的路径值 */
    modelValue: string
    /** 根路径，展示在输入框左侧；填相对路径时用它提示拼接基准 */
    rootPath?: string
    /** 是否展示根路径 */
    showRootPath?: boolean
    /** 是否展示选择按钮 */
    showPicker?: boolean
    /** 选择按钮拉起的选择目标：目录或文件，OSS 路径不需要选择按钮 */
    pickerMode?: 'directory' | 'file'
    /** 选择按钮文案 */
    pickerText?: string
    /** 输入框占位提示 */
    placeholder?: string
    /** 是否禁用输入与选择 */
    disabled?: boolean
    /** 是否可一键清空 */
    clearable?: boolean
  }>(),
  {
    rootPath: '',
    showRootPath: false,
    showPicker: false,
    pickerMode: 'directory',
    pickerText: '选择',
    placeholder: '',
    disabled: false,
    clearable: true
  }
)

/**
 * 组件事件
 */
const emit = defineEmits<{
  /** 更新路径值 */
  (event: 'update:modelValue', value: string): void
}>()

// 左侧根路径：开启展示且有根路径时才出现
const showRoot = computed(() => props.showRootPath && !!props.rootPath)

/**
 * 同步输入框的值
 * @param value 输入框最新值
 */
function handleInput(value: string | number): void {
  emit('update:modelValue', String(value ?? ''))
}

/**
 * 拉起系统选择框并把选到的路径回填
 *
 * 取消选择得到空路径，此时保持原值不动
 * @returns 选择完成的 Promise
 */
async function handlePick(): Promise<void> {
  const picked = await openFilePicker(props.pickerMode === 'directory')
  if (picked) emit('update:modelValue', picked)
}
</script>

<template>
  <el-input
    class="path-input"
    :model-value="modelValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :clearable="clearable"
    @update:model-value="handleInput"
  >
    <!-- readonly 输入框承载根路径：内容超宽时浏览器原生支持拖动横向查看 -->
    <template v-if="showRoot" #prepend>
      <input class="path-input__root" :value="rootPath" :title="rootPath" readonly tabindex="-1" />
    </template>
    <template v-if="showPicker" #append>
      <el-button :icon="Folder" :disabled="disabled" @click="handlePick">
        {{ pickerText }}
      </el-button>
    </template>
  </el-input>
</template>

<style scoped lang="scss">
.path-input {
  &__root {
    max-width: 180px;
    padding: 0;
    color: var(--el-text-color-secondary);
    vertical-align: middle;
    /* 按内容宽度自适应，短路径不占多余空间 */
    field-sizing: content;
    background: transparent;
    border: none;
    outline: none;
  }
}
</style>
