/**
 * 空调键盘-emits
 */
export type AirKeyboardEmits = {
  /**
   * 点击按键
   */
  clickKey: [keyType: AirKeyboardKeyType];
};

/**
 * 按键类型
 */
export type AirKeyboardKeyType =
  | "minus"
  | "power"
  | "plus"
  | "windSpeed"
  | "windDirection"
  | "timing"
  | "screenDisplay"
  | "mode";
