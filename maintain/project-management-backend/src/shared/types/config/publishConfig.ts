/**
 * @file 发布配置类型（跨进程共享）
 * @description 定义发布所需本地数据与 OSS 发布配置的数据结构
 */

/**
 * 发布控制器标识
 *
 * 决定项目发布时使用的控制器：generalAndroid -> GeneralAndroidPublishController，
 * generalWeb -> GeneralWebPublishController
 */
export type TPublishController = 'generalAndroid' | 'generalWeb'

/**
 * 项目信息
 */
export interface IProjectInfo {
  /** 项目名称 */
  projectName: string
  /** 项目路径 */
  projectPath: string
  /** 最新版本号（当前已发布的最新版本） */
  latestVersion: string
  /** 项目类型 */
  projectType: string
  /** 发布控制器标识 */
  publishController: TPublishController
}

/**
 * Android Studio 配置信息
 */
export interface IAndroidStudioInfo {
  /** JDK路径 */
  jdkPath: string
  /** SDK路径 */
  sdkPath: string
}

/**
 * 发布配置数据：统一存放本地数据与 OSS 发布配置
 */
export interface IPublishConfig {
  /** 项目信息列表 */
  projects: IProjectInfo[]
  /** 本地资源数据 */
  localAssets: {
    /** 本地根目录 */
    rootDir: string
    /** .secret 目录 */
    secretDir: string
  }
  /** OSS 资源数据 */
  ossAssets: {
    /** 发布根路径 */
    rootDir: string
    /** 版本清单文件路径 */
    versionManifestPath: string
    /** .secret 文件路径 */
    secretPath: string
  }
  /** Android Studio 相关配置 */
  androidStudio: IAndroidStudioInfo
}
