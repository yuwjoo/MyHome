/**
 * @file 发版 api
 * @description 渲染进程侧对发版主进程通道的方法封装，方法签名由 IPC 契约自动推导
 */
import { invoke } from '@preload/api/utils/handler'
import type { IpcApiShape } from '@preload/api/types/ipc'

// 发版 api
export const releaseApi: IpcApiShape['release'] = {
  /**
   * 获取项目列表
   * @returns 当前全部项目
   */
  getProjectList: () => {
    return invoke('release:getProjectList')
  },

  /**
   * 添加项目
   * @param project 项目信息
   * @returns 添加后的项目列表
   */
  addProject: (project) => {
    return invoke('release:addProject', project)
  },

  /**
   * 修改项目（按 projectName 定位后整体覆盖）
   * @param project 项目信息
   * @returns 修改后的项目列表
   */
  updateProject: (project) => {
    return invoke('release:updateProject', project)
  },

  /**
   * 删除项目
   * @param projectName 项目名称
   * @returns 删除后的项目列表
   */
  deleteProject: (projectName) => {
    return invoke('release:deleteProject', projectName)
  },

  /**
   * 获取 androidStudio 配置
   * @returns 当前 androidStudio 配置
   */
  getAndroidStudio: () => {
    return invoke('release:getAndroidStudio')
  },

  /**
   * 修改 androidStudio 配置
   * @param config androidStudio 配置
   * @returns 保存后的配置
   */
  updateAndroidStudio: (config) => {
    return invoke('release:updateAndroidStudio', config)
  }
}
