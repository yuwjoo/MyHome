import type { CloseAction } from "./BaseDialog";

/**
 * 确认对话框-emits
 */
export type ConfirmDialogEmits = {
  /**
   * 关闭对话框
   */
  close: [action: CloseAction];
};
