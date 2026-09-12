/**
 * @file 凭据模块
 * @description 读取本地 credentials.yaml，并提供缓存与刷新能力
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { load } from 'js-yaml'
import { myHomeStore } from '@main/stores/myHomeStore'
import type { ICredentials } from './types/credentials'

// 凭据数据缓存，null 表示未缓存
let credentialsCache: ICredentials | null = null

/**
 * 读取本地 credentials.yaml 并解析为凭据数据
 *
 * 凭据目录取自 myHomeStore.local.secretDir，
 * 读取/解析失败（secretDir 未配置、文件缺失或 YAML 非法）时抛错
 * @returns 解析后的凭据数据
 */
function loadCredentials(): ICredentials | null {
  if (!myHomeStore.store.local.secretDir) return null
  const configPath = resolve(myHomeStore.store.local.secretDir, 'credentials.yaml')
  return load(readFileSync(configPath, 'utf-8')) as ICredentials
}

/**
 * 获取凭据数据
 *
 * 已有缓存直接返回缓存，避免重复读盘；
 * 无缓存时读取本地 credentials.yaml，解析并写入缓存后返回
 * @returns 凭据数据
 */
export function fetchCredentials(): ICredentials | null {
  if (credentialsCache) return credentialsCache
  credentialsCache = loadCredentials()
  return credentialsCache
}

/**
 * 刷新凭据数据
 *
 * 先清空缓存，再强制重新读取本地 credentials.yaml，
 * 用最新文件内容更新缓存（文件有改动时需主动调用）
 * @returns 刷新后的凭据数据
 */
export function refreshCredentials(): ICredentials | null {
  credentialsCache = null
  return fetchCredentials()
}

/**
 * 监听 local.secretDir 字段变化：目录变化后清除缓存
 *
 * local 下其他字段（如 projects）变化时 secretDir 未变，直接忽略，避免误清缓存
 * @param newLocal 变化后的 local 配置（可能为 undefined）
 * @param oldLocal 变化前的 local 配置（可能为 undefined）
 */
myHomeStore.onDidChange('local', (newLocal, oldLocal) => {
  if (newLocal?.secretDir === oldLocal?.secretDir) return
  credentialsCache = null
})
