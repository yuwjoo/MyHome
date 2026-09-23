/**
 * @file 路径输入组件类型
 * @description 定义路径输入框的选择目标取值所需类型
 */

/**
 * 选择按钮拉起的选择目标
 */
export type TPickerMode =
  /** 目录 */
  | 'directory'
  /** 文件 */
  | 'file'
