import type { FileItem } from "@/views/cloudDisk/types/fileItem";

/**
 * 选择模式面板-props
 */
export const selectModePanelProps = {
  /**
   * 文件列表
   */
  fileList: {
    type: Array as PropType<FileItem[]>,
    default: () => []
  }
} as const;

/**
 * 选择模式面板-models
 */
export const selectModePanelModels = {
  /**
   * 选择的文件路径列表
   */
  modelValue: {
    type: Array as PropType<string[]>,
    default: () => []
  }
} as const;

/**
 * 头部动作栏-props
 */
export const headerActionBarProps = {
  /**
   * 文件列表
   */
  fileList: {
    type: Array as PropType<FileItem[]>,
    default: () => []
  }
} as const;

/**
 * 头部动作栏-models
 */
export const headerActionBarModels = {
  /**
   * 选择的文件路径列表
   */
  modelValue: {
    type: Array as PropType<string[]>,
    default: () => []
  }
} as const;

/**
 * 底部动作栏-models
 */
export const footerActionBarModels = {
  /**
   * 选择的文件路径列表
   */
  modelValue: {
    type: Array as PropType<string[]>,
    default: () => []
  }
} as const;
