/**
 * @file 发布 api
 * @description 渲染进程侧对发布主进程通道的方法封装，方法签名由 IPC 契约自动推导
 */
import { invoke } from '@preload/api/utils/handler'
import type { TIpcApiShape } from '@preload/api/types/ipc'

// 发布 api
export const publishApi: TIpcApiShape['publish'] = {
  /**
   * 获取本地项目列表
   * @returns 当前全部本地项目
   */
  getLocalProjectList: () => {
    return invoke('publish:getLocalProjectList')
  },

  /**
   * 获取单个本地项目
   * @param projectType 项目类型
   * @param projectName 项目名称
   * @returns 匹配的项目信息，未找到时为 null
   */
  getLocalProject: (projectType, projectName) => {
    return invoke('publish:getLocalProject', projectType, projectName)
  },

  /**
   * 保存本地项目（按项目类型 + 项目名称定位，存在则修改，不存在则新增）
   * @param project 项目信息
   * @returns 保存后的项目列表
   */
  saveLocalProject: (project) => {
    return invoke('publish:saveLocalProject', project)
  },

  /**
   * 删除本地项目
   * @param projectType 项目类型
   * @param projectName 项目名称
   * @returns 删除后的项目列表
   */
  deleteLocalProject: (projectType, projectName) => {
    return invoke('publish:deleteLocalProject', projectType, projectName)
  },

  /**
   * 获取设置
   * @returns 当前设置数据
   */
  getSetting: () => {
    return invoke('publish:getSetting')
  },

  /**
   * 更新设置（除项目列表外整体覆盖）
   * @param setting 最新设置数据
   * @returns 更新后的设置数据
   */
  updateSetting: (setting) => {
    return invoke('publish:updateSetting', setting)
  },

  /**
   * 发布项目（发布日志经 publish:publishLog 推送）
   * @param projectType 项目类型
   * @param projectName 项目名称
   * @param targetVersion 目标版本号
   * @returns 发布成功后的最新项目信息
   */
  publishProject: (projectType, projectName, targetVersion) => {
    return invoke('publish:publishProject', projectType, projectName, targetVersion)
  },

  /**
   * 中止发布
   * @param projectType 项目类型
   * @param projectName 项目名称
   * @returns 是否中止成功
   */
  abortPublish: (projectType, projectName) => {
    return invoke('publish:abortPublish', projectType, projectName)
  }
}
