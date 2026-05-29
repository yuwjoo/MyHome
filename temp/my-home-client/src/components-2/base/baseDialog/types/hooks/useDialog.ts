import type { BaseButtonType } from "@/components-2/base/baseButton/types";
import type { BeforeCloseFun, CloseAction } from "../BaseDialog";
import type { PromptBeforeCloseFun } from "../PromptDialog";

/**
 * 创建带输入框对话框-配置项
 */
export type CreatePromptDialogOptions = {
  title?: string;
  placeholder?: string;
  cancelButtonText?: string;
  confirmButtonText?: string;
  confirmButtonType?: BaseButtonType;
  cancelButtonType?: BaseButtonType;
  beforeClose?: PromptBeforeCloseFun;
  onClose?: (action: CloseAction, value: string) => void;
};

/**
 * 创建带输入框对话框-结果
 */
export type CreatePromptDialogResult = {
  action: CloseAction;
  value: string;
};

/**
 * 创建确认对话框-配置项
 */
export type CreateConfirmDialogOptions = {
  title?: string;
  message?: string;
  cancelButtonText?: string;
  confirmButtonText?: string;
  confirmButtonType?: BaseButtonType;
  cancelButtonType?: BaseButtonType;
  beforeClose?: BeforeCloseFun;
  onClose?: (action: CloseAction) => void;
};

/**
 * 创建确认对话框-结果
 */
export type CreateConfirmDialogResult = {
  action: CloseAction;
};

/**
 * 创建提示对话框-配置项
 */
export type CreateAlertDialogOptions = {
  title?: string;
  message?: string;
  closable?: boolean;
  showConfirmButton?: boolean;
  showCancelButton?: boolean;
  cancelButtonText?: string;
  confirmButtonText?: string;
  confirmButtonType?: BaseButtonType;
  cancelButtonType?: BaseButtonType;
  beforeClose?: BeforeCloseFun;
  onClose?: (action: CloseAction) => void;
};

/**
 * 创建提示对话框-结果
 */
export type CreateAlertDialogResult = {
  action: CloseAction;
};
