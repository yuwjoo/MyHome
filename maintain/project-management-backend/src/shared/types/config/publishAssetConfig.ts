/**
 * @file 发布资产配置类型（跨进程共享）
 * @description 定义发布相关本地数据与 OSS 配置的数据结构
 */

/**
 * 项目信息
 */
export interface ProjectInfo {
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
export interface AndroidStudioInfo {
  /** JDK路径 */
  jdkPath: string
  /** SDK路径 */
  sdkPath: string
}

/**
 * 发布资产配置数据：统一存放发布相关的本地数据与 OSS 发布配置
 */
export interface PublishAssetConfig {
  /** 本地数据 */
  local: {
    /** 本地根目录 */
    rootDir: string
    /** .secret 目录 */
    secretDir: string
    /** 项目信息列表 */
    projects: ProjectInfo[]
    /** Android Studio 相关配置 */
    androidStudio: AndroidStudioInfo
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
