/**
 * @file OSS 模块：通过 secret 模块获取凭据并创建 OSS 客户端；
 * OSS 凭据值变化（secretDir 变化或主动刷新）后自动重建客户端
 */
import OSS from 'ali-oss'
import { fetchCredentials } from '@main/module/secret/credentials'
import type { OssConfig } from '@main/module/secret/types/credentials'

/** OSS 客户端缓存 */
let ossClient: OSS | null = null
/** 当前客户端对应的 OSS 凭据值，null 表示未初始化 */
let curOssCredentials: OssConfig | null = null

/**
 * 判断两套 OSS 凭据是否一致（逐字段比较值，不比较对象引用）
 * @param a 凭据 A
 * @param b 凭据 B
 * @returns 字段值全部一致返回 true，任一字段为 null/undefined 且另一方有值时返回 false
 */
function isSameOssConfig(a: OssConfig | null, b: OssConfig | null): boolean {
  return (
    a?.region === b?.region &&
    a?.accessKeyId === b?.accessKeyId &&
    a?.accessKeySecret === b?.accessKeySecret &&
    a?.bucket === b?.bucket
  )
}

/**
 * 获取 OSS 客户端
 *
 * 基于 secret 模块缓存的凭据创建客户端；
 * OSS 凭据值变化（secretDir 变化或主动刷新）时自动重建；
 * 未配置 local.secretDir（fetchCredentials 返回 null）时抛错
 * @returns OSS 客户端
 */
export function getOssClient(): OSS {
  const ossCredentials = fetchCredentials()?.oss
  if (!ossCredentials) {
    throw new Error('OSS 客户端不可用：请先在配置中设置 local.secretDir')
  }
  if (ossClient && isSameOssConfig(curOssCredentials, ossCredentials)) {
    return ossClient
  }
  curOssCredentials = ossCredentials
  ossClient = new OSS(ossCredentials)
  return ossClient
}
