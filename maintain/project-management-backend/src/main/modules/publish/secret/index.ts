/**
 * @file secret模块出口
 * @description 对外提供密钥读取与刷新能力；模块定位为通用密钥管理
 */
export { fetchCredentials, refreshCredentials } from './credentials'
export type { ICredentials, IOssConfig } from './types/credentials'
