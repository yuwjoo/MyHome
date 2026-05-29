/**
 * 动作弹出层-emits
 */
export type ActionPopupEmits = {
  /**
   * 改变
   */
  change: [];
};

/**
 * 文件选择器-emits
 */
export type FileSelectorEmits = {
  /**
   * 选择文件
   */
  select: [files: File[]];
};
