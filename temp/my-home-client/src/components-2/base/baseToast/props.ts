import type { ToastProps } from "@node_modules/vant/lib";
import type { PropType } from "vue";

export const baseToastProps = {
  /**
   * 提示类型
   */
  type: {
    type: String as PropType<ToastProps["type"]>,
    default: "text"
  },
  /**
   * 显示位置
   */
  position: {
    type: String as PropType<ToastProps["position"]>,
    default: "middle"
  },
  /**
   * 提示消息
   */
  message: {
    type: String,
    default: ""
  },
  /**
   * 展示时长(ms)，值为 0 时，toast 不会消失
   */
  duration: {
    type: Number,
    default: 2000
  }
} as const;
