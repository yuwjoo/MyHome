/**
 * @file 对话框 IPC 契约（跨进程共享）
 * @description 定义对话框域的 API 通道契约，供主进程与预加载脚本共用
 */

/**
 * 文件类型过滤项
 */
export interface IFileFilter {
  /** 展示名称，如「安装包」 */
  name: string
  /** 扩展名集合，不含前导点，如 ['apk', 'aab'] */
  extensions: string[]
}

/**
 * 打开文件选择器的选项
 */
export interface IOpenFilePickerOptions {
  /** 是否选择文件夹；为 true 时只选文件夹，为 false 时只选文件 */
  selectDirectory?: boolean
  /** 选择框标题；部分 Linux 桌面环境不显示 */
  title?: string
  /** 默认定位：目录、完整文件路径或文件名 */
  defaultPath?: string
  /** 确认按钮文案，为空时用系统默认文案 */
  buttonLabel?: string
  /** 文件类型过滤，仅选文件时生效 */
  filters?: IFileFilter[]
  /** 是否允许多选 */
  multiSelections?: boolean
}

/**
 * 对话框 API
 */
export interface IDialogApi {
  /** 打开文件 / 文件夹选择器 */
  'dialog:openFilePicker': {
    args: [options?: IOpenFilePickerOptions]
    result: string[]
  }
}
