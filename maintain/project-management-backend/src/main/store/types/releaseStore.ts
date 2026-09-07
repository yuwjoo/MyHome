/**
 * @file 发版store-类型
 */

/**
 * 项目信息
 */
export interface ProjectInfo {
  /** 项目名称 */
  projectName: string
  /** 项目路径） */
  projectPath: string
  /** 项目版本号 */
  projectVersion: string
  /** 项目类型 */
  projectType: string
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
 * 发版配置数据
 */
export interface ReleaseConfig {
  /** 项目信息列表 */
  projects: ProjectInfo[]
  /** Android Studio 相关配置 */
  androidStudio: AndroidStudioInfo
}
