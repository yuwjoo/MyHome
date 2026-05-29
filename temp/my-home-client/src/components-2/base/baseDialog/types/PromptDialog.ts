import type { CloseAction } from "./BaseDialog";

/**
 * 带输入框对话框-emits
 */
export type PromptDialogEmits = {
  /**
   * 关闭对话框
   */
  close: [action: CloseAction, value: string];
};

/**
 * 关闭前置拦截函数
 */
export type PromptBeforeCloseFun = (action: CloseAction, value: string) => boolean | Promise<boolean | void>;
