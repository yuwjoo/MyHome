export const basePopupProps = {
  /**
   * 显示关闭按钮
   */
  closeable: {
    type: Boolean,
    default: false
  },
  /**
   * 弹出层高度
   */
  height: {
    type: String,
    default: "45%"
  },
  /**
   * 弹出层标题
   */
  title: {
    type: String,
    required: false
  }
} as const;

export const basePopupModels = {
  /**
   * 显示弹窗层
   */
  show: {
    type: Boolean,
    default: false
  }
};
