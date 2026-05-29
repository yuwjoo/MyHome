/**
 * 基础对话框-slots
 */
export type BaseDialogSlots = {
  /**
   * 标题区域
   */
  title?: () => void;
  /**
   * 内容区域
   */
  default?: () => void;
  /**
   * 底部区域
   */
  footer?: () => void;
};

/**
 * 基础对话框-emits
 */
export type BaseDialogEmits = {
  /**
   * 关闭对话框
   */
  close: [action: CloseAction];
};

/**
 * 关闭前置拦截函数
 */
export type BeforeCloseFun = (action: CloseAction) => boolean | Promise<boolean | void>;

/**
 * 关闭动作
 */
export type CloseAction = "close" | "confirm" | "cancel";
