export type BaseButtonSlots = {
  /**
   * 按钮图标
   */
  icon: () => void;
  /**
   * 按钮内容
   */
  default: () => void;
};

export type BaseButtonEmits = {
  /**
   * 点击按钮
   */
  click: [ev: MouseEvent];
};

/**
 * 按钮类型
 */
export type BaseButtonType = "default" | "primary" | "success" | "warning" | "danger" | "info";

/**
 * 按钮尺寸
 */
export type BaseButtonSize = "normal" | "small";
