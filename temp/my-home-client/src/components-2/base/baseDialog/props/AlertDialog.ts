import type { BaseButtonType } from "../../baseButton/types";
import type { BeforeCloseFun } from "../types/BaseDialog";

/**
 * 提示对话框-props
 */
export const alertDialogProps = {
  /**
   * 对话框标题
   */
  title: {
    type: String,
    default: ""
  },
  /**
   * 对话框消息
   */
  message: {
    type: String,
    default: ""
  },
  /**
   * 显示关闭按钮
   */
  closable: {
    type: Boolean,
    default: true
  },
  /**
   * 是否展示确认按钮
   */
  showConfirmButton: {
    type: Boolean,
    default: false
  },
  /**
   * 是否展示取消按钮
   */
  showCancelButton: {
    type: Boolean,
    default: false
  },
  /**
   * 取消按钮文案
   */
  cancelButtonText: {
    type: String,
    default: "取消"
  },
  /**
   * 确认按钮文案
   */
  confirmButtonText: {
    type: String,
    default: "确认"
  },
  /**
   * 确认按钮类型
   */
  confirmButtonType: {
    type: String as PropType<BaseButtonType>,
    default: "primary"
  },
  /**
   * 取消按钮类型
   */
  cancelButtonType: {
    type: String as PropType<BaseButtonType>,
    default: "default"
  },
  /**
   * 关闭前的回调函数，返回 false 可阻止关闭，支持返回 Promise
   */
  beforeClose: {
    type: Function as PropType<BeforeCloseFun>,
    required: false
  }
};
