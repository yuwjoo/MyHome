/**
 * @file Shell 模块出口
 * @description 对外暴露 Shell 实例与相关类型
 */
export { Shell } from './shell'
export type {
  IShellExit,
  IShellLog,
  IShellOptions,
  TShellExitListener,
  TShellLogListener,
  TShellLogType
} from './types/shell'
