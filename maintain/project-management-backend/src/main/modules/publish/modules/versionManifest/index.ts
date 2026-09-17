/**
 * @file 版本清单模块
 * @description 通过 OSS 读写版本清单 json（路径取路径工具的 resolveOssVersionManifestPath），并在进程内缓存一份
 */
import { getOssClient } from '@main/modules/publish/modules/oss'
import { publishStore } from '@main/stores/publishStore'
import { resolveOssVersionManifestPath } from '../../utils/path'
import type { IVersionManifest } from './types/versionManifest'

// 版本清单缓存，null 表示未缓存
let versionManifestCache: IVersionManifest | null = null

/**
 * 取本地清单数据
 *
 * 优先用缓存，缓存为空时从 OSS 读取一份写入缓存
 * @returns 本地清单数据
 * @throws OSS 凭据未配置、清单文件不存在或 json 非法时抛错
 */
async function resolveLocalManifest(): Promise<IVersionManifest> {
  return versionManifestCache ?? (await fetchVersionManifest())
}

/**
 * 获取版本清单
 *
 * 已有缓存直接返回缓存，不再请求 OSS；
 * 无缓存时从 OSS 读取版本清单 json 文件，解析成 json 写入缓存后返回
 * @returns 版本清单数据
 * @throws OSS 凭据未配置、清单文件不存在或 json 非法时抛错
 */
export async function fetchVersionManifest(): Promise<IVersionManifest> {
  if (versionManifestCache) return versionManifestCache
  const result = await getOssClient().get(resolveOssVersionManifestPath())
  versionManifestCache = JSON.parse(result.content.toString()) as IVersionManifest
  return versionManifestCache
}

/**
 * 获取某个项目的版本号
 *
 * 读的是本地清单数据（有缓存用缓存，无缓存时先从 OSS 读一次）；
 * 项目类型或项目名称在清单里不存在时返回 null，不会自动补建
 * @param projectType 项目类型（android / web / ...），对应清单第一层 key
 * @param projectName 项目名称，对应清单第二层 key
 * @returns 该项目的版本号，清单中没有该项目时为 null
 * @throws OSS 凭据未配置、清单文件不存在或 json 非法时抛错
 */
export async function fetchProjectVersion(
  projectType: string,
  projectName: string
): Promise<string | null> {
  const manifest = await resolveLocalManifest()
  return manifest[projectType]?.[projectName] ?? null
}

/**
 * 上传版本清单
 *
 * 用传入的最新清单覆盖 OSS 上的版本清单 json 文件，上传成功后同步更新本地缓存；
 * 不传清单时用本地清单数据（本地缓存为空则先读取一次 OSS）；
 * 上传失败时抛错，缓存保持原值不变
 * @param manifest 最新的版本清单数据，缺省用本地清单数据
 * @returns 上传后的版本清单数据
 * @throws OSS 凭据未配置、本地与 OSS 均无清单或上传失败时抛错
 */
export async function uploadVersionManifest(
  manifest?: IVersionManifest
): Promise<IVersionManifest> {
  const next = manifest ?? (await resolveLocalManifest())
  await getOssClient().put(
    resolveOssVersionManifestPath(),
    Buffer.from(JSON.stringify(next, null, 2), 'utf-8')
  )
  versionManifestCache = next
  return versionManifestCache
}

/**
 * 更新版本清单里某个项目的版本号
 *
 * 改的始终是本地清单数据，upload 为 true 时再把整份清单上传到 OSS，否则只留存在本地缓存；
 * 项目类型与项目名称在清单里不存在时会自动补建
 * @param projectType 项目类型（android / web / ...），对应清单第一层 key
 * @param projectName 项目名称，对应清单第二层 key
 * @param version 要写入的版本号
 * @param upload 是否连同本地清单上传到 OSS，默认 false 只更新本地
 * @returns 更新后的版本清单数据
 * @throws 本地与 OSS 均无清单，或 upload 为 true 且上传失败时抛错
 */
export async function updateProjectVersion(
  projectType: string,
  projectName: string,
  version: string,
  upload = false
): Promise<IVersionManifest> {
  const manifest = await resolveLocalManifest()
  const versionRecord = (manifest[projectType] ??= {})
  versionRecord[projectName] = version
  versionManifestCache = manifest
  if (!upload) return manifest
  return uploadVersionManifest(manifest)
}

/**
 * 监听 ossAssets.versionManifestPath 字段变化：路径变化后清除缓存
 *
 * ossAssets 下其他字段（如 rootDir）变化时路径未变，直接忽略，避免误清缓存
 * @param newOssAssets 变化后的 ossAssets 配置（可能为 undefined）
 * @param oldOssAssets 变化前的 ossAssets 配置（可能为 undefined）
 */
publishStore.onDidChange('ossAssets', (newOssAssets, oldOssAssets) => {
  if (newOssAssets?.versionManifestPath === oldOssAssets?.versionManifestPath) return
  versionManifestCache = null
})
