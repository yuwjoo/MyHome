import type { CloseAction } from "./BaseDialog";

/**
 * 提示对话框-emits
 */
export type AlertDialogEmits = {
  /**
   * 关闭对话框
   */
  close: [action: CloseAction];
};
