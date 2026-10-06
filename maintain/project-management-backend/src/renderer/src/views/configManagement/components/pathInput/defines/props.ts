/**
 * @file 路径输入组件 props 定义
 * @description
 */
import type { PropType } from 'vue'
import type { TPathPlatform } from '@shared/types/ipc/path'
import type { TPickerTarget } from '../types/defines'

/**
 * 路径输入组件 props
 */
export const pathInputProps = {
  /** 路径 */
  path: {
    type: String,
    default: ''
  },
  /** 父路径 */
  parentPath: {
    type: String,
    default: ''
  },
  /** 路径所用的分隔符平台：posix 用 /，win32 用 \，system 跟随当前系统 */
  separatorPlatform: {
    type: String as PropType<TPathPlatform>,
    default: 'system'
  },
  /** 允许文件选择器 */
  allowFilePicker: {
    type: Boolean,
    default: false
  },
  /** 文件选择器目标 */
  pickerTarget: {
    type: String as PropType<TPickerTarget>,
    default: 'directory'
  },
  /** 选择框默认定位的路径；为空时由系统决定起始位置 */
  pickerDefaultPath: {
    type: String,
    default: ''
  },
  /** 输入框占位提示 */
  placeholder: {
    type: String,
    default: ''
  },
  /** 是否禁用 */
  disabled: {
    type: Boolean,
    default: false
  },
  /** 是否可清空 */
  clearable: {
    type: Boolean,
    default: true
  },
  /** 输入框是否可编辑 */
  editable: {
    type: Boolean,
    default: true
  }
} as const
