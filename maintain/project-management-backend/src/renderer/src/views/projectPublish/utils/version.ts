/**
 * @file 版本号工具
 * @description 提供版本号格式校验与下一版本号的推断
 */

/**
 * 校验版本号格式：点分正整数，如 1、1.2、1.2.3
 * @param version 待校验的版本号
 * @returns 格式合法时为 true
 */
export function isValidVersion(version: string): boolean {
  return /^\d+(\.\d+)*$/.test(version.trim())
}

/**
 * 推断下一版本号：末段数字 +1，如 0.0.52 -> 0.0.53
 * @param latestVersion 当前最新版本号
 * @returns 建议的下一版本号；格式不可识别时原样返回，由用户自行修正
 */
export function resolveNextVersion(latestVersion: string): string {
  const version = latestVersion.trim()
  if (!isValidVersion(version)) return version
  const segments = version.split('.')
  const lastIndex = segments.length - 1
  segments[lastIndex] = String(Number(segments[lastIndex]) + 1)
  return segments.join('.')
}
