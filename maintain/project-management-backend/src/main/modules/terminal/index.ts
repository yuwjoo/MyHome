/**
 * @file 终端模块出口
 * @description 对外暴露终端实例与相关类型
 */
export { Terminal } from './terminal'
export type {
  ITerminalExit,
  ITerminalLog,
  ITerminalOptions,
  TTerminalExitListener,
  TTerminalLogListener,
  TTerminalLogType
} from './types/terminal'
