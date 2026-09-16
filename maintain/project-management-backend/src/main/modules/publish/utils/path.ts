/**
 * @file 路径工具
 * @description 把配置里的相对路径拼成完整路径：local 下的路径相对 local.rootDir，oss 下的路径相对 oss.rootDir
 */
import { posix, resolve } from 'node:path'
import { myHomeStore } from '@main/stores/myHomeStore'

/**
 * 获取完整本地 .secret 目录
 *
 * 由 local.rootDir 与 local.secretDir 拼接
 * @returns 完整 .secret 目录的本地绝对路径
 */
export function resolveLocalSecretDir(): string {
  const { rootDir, secretDir } = myHomeStore.get('local')
  return resolve(rootDir, secretDir)
}

/**
 * 获取完整项目 OSS 发布目录
 *
 * 由 oss.rootDir 与项目信息里的 ossPublishDir 拼接
 * @param ossPublishDir 项目信息里的 OSS 发布目录（相对 oss.rootDir）
 * @returns 完整 OSS 发布目录（posix 风格，不带首尾斜杠）
 */
export function resolveProjectOssPublishDir(ossPublishDir: string): string {
  return resolveOssPath(ossPublishDir)
}

/**
 * 获取完整 OSS 版本清单文件路径
 *
 * 由 oss.rootDir 与 oss.versionManifestPath 拼接
 * @returns 完整 OSS 版本清单文件路径（posix 风格，不带首尾斜杠）
 */
export function resolveOssVersionManifestPath(): string {
  return resolveOssPath(myHomeStore.get('oss').versionManifestPath)
}

/**
 * 获取完整 OSS .secret 文件路径
 *
 * 由 oss.rootDir 与 oss.secretPath 拼接
 * @returns 完整 OSS .secret 文件路径（posix 风格，不带首尾斜杠）
 */
export function resolveOssSecretPath(): string {
  return resolveOssPath(myHomeStore.get('oss').secretPath)
}

/**
 * 拼 OSS 完整路径：把相对 oss.rootDir 的路径挂到 oss.rootDir 下
 *
 * 先挂到根目录拼（顺带处理两端的斜杠、重复斜杠与空目录），再去掉开头的 /
 * @param relativePath 相对 oss.rootDir 的路径
 * @returns 完整 OSS 路径（posix 风格，不带首尾斜杠）
 */
function resolveOssPath(relativePath: string): string {
  return posix.join('/', myHomeStore.get('oss').rootDir, relativePath).slice(1)
}
