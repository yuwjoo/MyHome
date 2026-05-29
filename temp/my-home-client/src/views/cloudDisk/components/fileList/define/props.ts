import type { FileItem } from "@/views/cloudDisk/types/fileItem";

/**
 * 文件列表-props
 */
export const fileListProps = {
  /**
   * v-model 绑定的目录路径
   */
  modelValue: {
    type: String,
    required: true
  }
} as const;

/**
 * 文件卡片-props
 */
export const fileCardProps = {
  /**
   * 文件项数据
   */
  fileItem: {
    type: Object as PropType<FileItem>,
    required: true
  }
} as const;
