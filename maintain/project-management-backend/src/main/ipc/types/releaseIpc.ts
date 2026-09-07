/**
 * @file 发版 IPC
 */
import type { AndroidStudioInfo, ProjectInfo } from '../../store/types/releaseStore'

/**
 * 发版 API
 */
export interface ReleaseIpcApi {
  /** 获取项目列表 */
  'release:getProjectList': {
    args: []
    result: ProjectInfo[]
  }

  /** 添加项目 */
  'release:addProject': {
    args: [project: ProjectInfo]
    result: ProjectInfo[]
  }

  /** 修改项目 */
  'release:updateProject': {
    args: [project: ProjectInfo]
    result: ProjectInfo[]
  }

  /** 删除项目 */
  'release:deleteProject': {
    args: [projectName: string]
    result: ProjectInfo[]
  }

  /** 获取 androidStudio 配置 */
  'release:getAndroidStudio': {
    args: []
    result: AndroidStudioInfo
  }

  /** 修改 androidStudio 配置 */
  'release:updateAndroidStudio': {
    args: [config: AndroidStudioInfo]
    result: AndroidStudioInfo
  }
}

/**
 * 发版 MSG
 */
export interface ReleaseIpcMsg {
  // 有实际推送事件时在此补充，示例：
  // /** 项目数据变更 */
  // 'release:projectsChanged': [projects: ProjectInfo[]]
}
