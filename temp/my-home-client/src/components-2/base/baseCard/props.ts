export const baseCardProps = {
  /**
   * 卡片标题
   */
  title: {
    type: String,
    required: false
  },
  /**
   * 不需要内边距
   */
  noPadding: {
    type: Boolean,
    default: false
  }
} as const;
