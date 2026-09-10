/**
 * @file 凭据模块出口
 * @description 对外提供凭据读取与刷新能力
 */
export { fetchCredentials, refreshCredentials } from './credentials'
export type { ICredentials, IOssConfig } from './types/credentials'
