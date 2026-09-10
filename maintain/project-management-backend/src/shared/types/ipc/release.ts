/**
 * @file 发版 IPC 契约（跨进程共享）
 * @description 定义发版域的 API 与 MSG 通道契约，供主进程与预加载脚本共用
 */
import type { IAndroidStudioInfo, IProjectInfo } from '@shared/types/config'

/**
 * 发版 API
 */
export interface IReleaseApi {
  /** 获取项目列表 */
  'release:getProjectList': {
    args: []
    result: IProjectInfo[]
  }

  /** 添加项目 */
  'release:addProject': {
    args: [project: IProjectInfo]
    result: IProjectInfo[]
  }

  /** 修改项目 */
  'release:updateProject': {
    args: [project: IProjectInfo]
    result: IProjectInfo[]
  }

  /** 删除项目 */
  'release:deleteProject': {
    args: [projectName: string]
    result: IProjectInfo[]
  }

  /** 获取 androidStudio 配置 */
  'release:getAndroidStudio': {
    args: []
    result: IAndroidStudioInfo
  }

  /** 修改 androidStudio 配置 */
  'release:updateAndroidStudio': {
    args: [config: IAndroidStudioInfo]
    result: IAndroidStudioInfo
  }
}

/**
 * 发版 MSG
 */
export interface IReleaseMsg {
  // 有实际推送事件时在此补充，示例：
  // /** 项目数据变更 */
  // 'release:projectsChanged': [projects: IProjectInfo[]]
}
