/**
 * @file 发布模块出口
 * @description 对外暴露发布相关能力：凭据读取、OSS 客户端、Shell 命令执行
 */
export { BasePublishController } from './base'
export { getOssClient } from './modules/oss'
export { fetchCredentials, refreshCredentials } from './modules/secret'
export type { ICredentials, IOssConfig } from './modules/secret'
export { Shell } from './modules/shell'
export type {
  IShellExit,
  IShellLog,
  IShellOptions,
  TShellExitListener,
  TShellLogListener,
  TShellLogType
} from './modules/shell'
