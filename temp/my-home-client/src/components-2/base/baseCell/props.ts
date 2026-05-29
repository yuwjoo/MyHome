import type { PropType } from "vue";

export const baseCellProps = {
  /**
   * 单元格标题
   */
  title: {
    type: String,
    required: false
  },
  /**
   * 单元格内容
   */
  value: {
    type: String,
    required: false
  },
  /**
   * 是否开启点击反馈
   */
  clickable: {
    type: Boolean,
    default: null
  },
  /**
   * 是否展示右侧箭头并开启点击反馈
   */
  isLink: {
    type: Boolean,
    default: false
  },
  /**
   * 内容对齐方式
   */
  valueAlign: {
    type: String as PropType<"left" | "center" | "right">,
    default: "right"
  }
} as const;
