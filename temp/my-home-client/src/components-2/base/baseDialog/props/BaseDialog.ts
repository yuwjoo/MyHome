import type { PropType } from "vue";
import type { BeforeCloseFun } from "../types/BaseDialog";
import type { BaseButtonType } from "../../baseButton/types";

/**
 * 基础对话框-props
 */
export const baseDialogProps = {
  /**
   * 对话框标题
   */
  title: {
    type: String,
    required: false
  },
  /**
   * 显示关闭按钮
   */
  closable: {
    type: Boolean,
    default: false
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
   * 确认按钮文案
   */
  confirmButtonText: {
    type: String,
    default: "确认"
  },
  /**
   * 取消按钮文案
   */
  cancelButtonText: {
    type: String,
    default: "取消"
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
  },
  /**
   * 是否在点击遮罩层后关闭弹窗
   */
  closeOnClickOverlay: {
    type: Boolean,
    default: false
  }
} as const;

/**
 * 基础对话框-models
 */
export const baseDialogModels = {
  /**
   * 显示对话框
   */
  show: {
    type: Boolean,
    default: false
  }
};
