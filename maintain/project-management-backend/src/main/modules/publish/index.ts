/**
 * @file 发布模块出口
 * @description 对外暴露发布相关能力：凭据读取、OSS 客户端、Shell 命令执行
 */
export { getOssClient } from './oss'
export { fetchCredentials, refreshCredentials } from './secret'
export type { ICredentials, IOssConfig } from './secret'
export { Shell } from './shell'
export type {
  IShellExit,
  IShellLog,
  IShellOptions,
  TShellExitListener,
  TShellLogListener,
  TShellLogType
} from './shell'
