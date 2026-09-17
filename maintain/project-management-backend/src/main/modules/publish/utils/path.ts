/**
 * @file 路径工具
 * @description 统一计算本地资源与 OSS 资源路径：localAssets 下的路径相对 localAssets.rootDir，ossAssets 下的路径相对 ossAssets.rootDir
 */
import { posix, resolve } from 'node:path'
import { publishStore } from '@main/stores/publishStore'

/**
 * 获取完整本地 .secret 目录
 *
 * 由 localAssets.rootDir 与 localAssets.secretDir 拼接；两者任一未配置时返回空字符串
 * @returns 完整 .secret 目录的本地绝对路径，未配置时为空字符串
 */
export function resolveLocalSecretDir(): string {
  const { rootDir, secretDir } = publishStore.get('localAssets')
  if (!rootDir || !secretDir) return ''
  return resolve(rootDir, secretDir)
}

/**
 * 获取完整项目 OSS 发布目录
 *
 * 由 ossAssets.rootDir、项目类型与项目名称拼接：{ossAssets.rootDir}/{项目类型}/{项目名称}
 * @param projectType 项目类型（android / web / ...）
 * @param projectName 项目名称
 * @returns 完整 OSS 发布目录（posix 风格，不带首尾斜杠）
 */
export function resolveProjectOssPublishDir(projectType: string, projectName: string): string {
  return resolveOssPath(posix.join(projectType, projectName))
}

/**
 * 获取项目产物在 OSS 上的完整对象路径
 *
 * 由项目 OSS 发布目录与产物文件名拼接
 * @param projectType 项目类型（android / web / ...）
 * @param projectName 项目名称
 * @param fileName 产物文件名
 * @returns 完整 OSS 对象路径（posix 风格，不带首尾斜杠）
 */
export function resolveProjectOssAssetPath(
  projectType: string,
  projectName: string,
  fileName: string
): string {
  return posix.join(resolveProjectOssPublishDir(projectType, projectName), fileName)
}

/**
 * 获取完整 OSS 版本清单文件路径
 *
 * 由 ossAssets.rootDir 与 ossAssets.versionManifestPath 拼接
 * @returns 完整 OSS 版本清单文件路径（posix 风格，不带首尾斜杠）
 */
export function resolveOssVersionManifestPath(): string {
  return resolveOssPath(publishStore.get('ossAssets').versionManifestPath)
}

/**
 * 获取完整 OSS .secret 文件路径
 *
 * 由 ossAssets.rootDir 与 ossAssets.secretPath 拼接
 * @returns 完整 OSS .secret 文件路径（posix 风格，不带首尾斜杠）
 */
export function resolveOssSecretPath(): string {
  return resolveOssPath(publishStore.get('ossAssets').secretPath)
}

/**
 * 拼 OSS 完整路径：把相对 ossAssets.rootDir 的路径挂到 ossAssets.rootDir 下
 *
 * 先挂到根目录拼（顺带处理两端的斜杠、重复斜杠与空目录），再去掉开头的 /
 * @param relativePath 相对 ossAssets.rootDir 的路径
 * @returns 完整 OSS 路径（posix 风格，不带首尾斜杠）
 */
function resolveOssPath(relativePath: string): string {
  return posix.join('/', publishStore.get('ossAssets').rootDir, relativePath).slice(1)
}
