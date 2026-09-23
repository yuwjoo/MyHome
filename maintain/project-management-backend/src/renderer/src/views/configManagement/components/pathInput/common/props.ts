/**
 * @file 路径输入组件 props 定义
 * @description
 */
import type { PropType } from 'vue'
import type { TPickerMode } from '../types/common'

/**
 * 路径输入组件 props
 */
export const pathInputProps = {
  /** 输入框中的路径：手动输入时就是输入值，选择文件后是选中路径去掉父路径 */
  path: {
    type: String,
    default: ''
  },
  /** 是否展示父路径 */
  showParentPath: {
    type: Boolean,
    default: false
  },
  /** 父路径，展示在输入框左侧；完整路径由它与输入框中的路径拼出 */
  parentPath: {
    type: String,
    default: ''
  },
  /** 路径分隔符：拼接父路径与输入框中的路径时使用；不填时取系统分隔符 */
  separator: {
    type: String,
    default: ''
  },
  /** 是否展示选择按钮 */
  showPicker: {
    type: Boolean,
    default: false
  },
  /** 选择目标：目录或文件，OSS 路径不需要选择按钮 */
  pickerMode: {
    type: String as PropType<TPickerMode>,
    default: 'directory'
  },
  /** 选择按钮文案 */
  pickerButtonText: {
    type: String,
    default: '选择'
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
  /** 是否禁用输入与选择 */
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
