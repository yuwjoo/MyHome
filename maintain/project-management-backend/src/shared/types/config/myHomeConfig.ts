/**
 * @file MyHome 配置类型（跨进程共享）
 * @description 定义 MyHome 本地数据与 OSS 发布配置的数据结构
 */

/**
 * 项目信息
 */
export interface IProjectInfo {
  /** 项目名称 */
  projectName: string
  /** 项目路径 */
  projectPath: string
  /** 项目版本号 */
  projectVersion: string
  /** 项目类型 */
  projectType: string
  /** OSS 发布目录 */
  ossPublishDir: string
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
 * MyHome 配置数据：统一存放本地数据与 OSS 发布配置
 */
export interface IMyHomeConfig {
  /** 本地数据 */
  local: {
    /** 本地根目录 */
    rootDir: string
    /** .secret 目录 */
    secretDir: string
    /** 项目信息列表 */
    projects: IProjectInfo[]
    /** Android Studio 相关配置 */
    androidStudio: IAndroidStudioInfo
  }
  /** OSS数据 */
  oss: {
    /** 发布根路径 */
    rootDir: string
    /** 版本清单文件路径 */
    versionManifestPath: string
    /** .secret 文件路径 */
    secretPath: string
  }
}
