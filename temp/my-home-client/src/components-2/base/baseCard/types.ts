export type BaseCardSlots = {
  /**
   * 卡片头部
   */
  header: () => void;
  /**
   * 卡片内容
   */
  default: () => void;
  /**
   * 卡片底部
   */
  footer: () => void;
};
