import { buttonProps } from "vant";
import type { PropType } from "vue";
import type { BaseButtonType, BaseButtonSize } from "./types";

export const baseButtonProps = {
  /**
   * 按钮类型
   */
  type: {
    type: String as PropType<BaseButtonType>,
    default: "default"
  },
  /**
   * 按钮尺寸
   */
  size: {
    type: String as PropType<BaseButtonSize>,
    default: "normal"
  },
  /**
   * 禁用状态
   */
  disabled: buttonProps.disabled,
  /**
   * 加载状态
   */
  loading: buttonProps.loading
} as const;
