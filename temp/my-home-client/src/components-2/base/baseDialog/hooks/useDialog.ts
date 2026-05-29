import { createVNode, render, type Component, type VNode } from "vue";
import PromptDialog from "../templates/PromptDialog.vue";
import type {
  CreateAlertDialogOptions,
  CreateAlertDialogResult,
  CreateConfirmDialogOptions,
  CreateConfirmDialogResult,
  CreatePromptDialogOptions,
  CreatePromptDialogResult
} from "../types/hooks/useDialog";
import ConfirmDialog from "../templates/ConfirmDialog.vue";
import type { CloseAction } from "../types/BaseDialog";
import AlertDialog from "../templates/AlertDialog.vue";

let currentDialogVm: VNode | null = null; // 当前对话框vnode

/**
 * 对话框-hook
 */
export const useDialog = () => {
  return {
    prompt: createPromptDialog,
    confirm: createConfirmDialog,
    alert: createAlertDialog,
    close: () => (currentDialogVm ? closeDialog(currentDialogVm) : undefined)
  };
};

/**
 * 打开对话框
 * @param vm vnode
 */
const openDialog = (vm: VNode) => {
  vm.component!.exposed!.openDialog();
};

/**
 * 关闭对话框
 * @param vm vnode
 */
const closeDialog = (vm: VNode) => {
  vm.component!.exposed!.closeDialog();
};

/**
 * 渲染对话框
 * @param dialog 对话框组件
 * @param props 对话框props
 * @return 对话框vnode
 */
const renderDialog = (dialog: Component, props: Record<string, any>): VNode => {
  const vm = createVNode(dialog, props);
  render(vm, document.body);
  openDialog(vm);
  currentDialogVm = vm;

  return vm;
};

/**
 * 创建带输入框对话框
 * @param options 配置项
 * @return 对话框Promise
 */
const createPromptDialog = (options: CreatePromptDialogOptions): Promise<CreatePromptDialogResult> => {
  return new Promise<CreatePromptDialogResult>((resolve) => {
    renderDialog(PromptDialog, {
      title: options.title,
      placeholder: options.placeholder,
      cancelButtonText: options.cancelButtonText,
      confirmButtonText: options.confirmButtonText,
      confirmButtonType: options.confirmButtonType,
      cancelButtonType: options.cancelButtonType,
      beforeClose: options.beforeClose,
      onClose: (action: CloseAction, value: string) => {
        options.onClose?.(action, value);
        resolve({ action, value });
      }
    });
  });
};

/**
 * 创建确认对话框
 * @param options 配置项
 * @return 对话框Promise
 */
const createConfirmDialog = (options: CreateConfirmDialogOptions): Promise<CreateConfirmDialogResult> => {
  return new Promise<CreateConfirmDialogResult>((resolve) => {
    renderDialog(ConfirmDialog, {
      title: options.title,
      message: options.message,
      cancelButtonText: options.cancelButtonText,
      confirmButtonText: options.confirmButtonText,
      confirmButtonType: options.confirmButtonType,
      cancelButtonType: options.cancelButtonType,
      beforeClose: options.beforeClose,
      onClose: (action: CloseAction) => {
        options.onClose?.(action);
        resolve({ action });
      }
    });
  });
};

/**
 * 创建提示对话框
 * @param options 配置项
 * @return 对话框Promise
 */
const createAlertDialog = (options: CreateAlertDialogOptions): Promise<CreateAlertDialogResult> => {
  return new Promise<CreateConfirmDialogResult>((resolve) => {
    renderDialog(AlertDialog, {
      title: options.title,
      message: options.message,
      closable: options.closable,
      showCancelButton: options.showCancelButton,
      showConfirmButton: options.showConfirmButton,
      cancelButtonText: options.cancelButtonText,
      confirmButtonText: options.confirmButtonText,
      confirmButtonType: options.confirmButtonType,
      cancelButtonType: options.cancelButtonType,
      beforeClose: options.beforeClose,
      onClose: (action: CloseAction) => {
        options.onClose?.(action);
        resolve({ action });
      }
    });
  });
};
