/**
 * @file 版本号工具
 * @description 语义化版本号的解析与形态转换，供发布流程复用
 */

/**
 * 语义化版本号转 Android versionCode
 *
 * 规则：major * 10000 + minor * 100 + patch，如 0.0.52 -> 52、1.2.3 -> 10203；
 * 段位缺失或非数字（如 0.1、0.1.x）按 0 处理
 * @param version 版本号，如 0.0.52
 * @returns 对应的 versionCode
 */
export function versionToCode(version: string): number {
  const [major = 0, minor = 0, patch = 0] = version.split('.').map((part) => Number(part) || 0)
  return major * 10000 + minor * 100 + patch
}
