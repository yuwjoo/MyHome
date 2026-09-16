/**
 * @file 版本清单类型
 * @description 定义 OSS 上 versionManifest.json 的数据结构
 */

/**
 * 单个项目类型下的版本记录：项目名称 -> 版本号
 */
export type TVersionRecord = Record<string, string>

/**
 * 版本清单：项目类型 -> 项目名称 -> 版本号
 *
 * 例：{ "android": { "MyHome": "0.0.52" }, "web": { "my-home-mobile": "0.0.19" } }
 */
export interface IVersionManifest {
  /**
   * key 为项目类型（android / web / ...），value 为该类型下各项目的版本记录
   *
   * 新增类型无需改此类型；清单里还没有该类型时取值为 undefined，读取方需自行兜底
   */
  [projectType: string]: TVersionRecord | undefined
}
