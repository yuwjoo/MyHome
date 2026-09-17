/**
 * @file 发布 IPC 通道
 * @description 对接发布模块：本地项目增删改查、设置读写、发布与中止发布
 */
import {
  abortPublish,
  deleteLocalProject,
  getLocalProject,
  getLocalProjectList,
  getSetting,
  publishProject,
  saveLocalProject,
  updateSetting
} from '@main/modules/publish'
import { handle, send } from '../utils/handler'

/**
 * 获取本地项目列表
 * @returns 当前全部本地项目
 */
handle('publish:getLocalProjectList', () => {
  return getLocalProjectList()
})

/**
 * 获取单个本地项目
 * @param projectType 项目类型
 * @param projectName 项目名称
 * @returns 匹配的项目信息，未找到时为 null
 */
handle('publish:getLocalProject', (_event, projectType, projectName) => {
  return getLocalProject(projectType, projectName)
})

/**
 * 保存本地项目
 * @param project 项目信息
 * @returns 保存后的项目列表
 */
handle('publish:saveLocalProject', (_event, project) => {
  return saveLocalProject(project)
})

/**
 * 删除本地项目
 * @param projectType 项目类型
 * @param projectName 项目名称
 * @returns 删除后的项目列表
 */
handle('publish:deleteLocalProject', (_event, projectType, projectName) => {
  return deleteLocalProject(projectType, projectName)
})

/**
 * 获取设置
 * @returns 当前设置数据
 */
handle('publish:getSetting', () => {
  return getSetting()
})

/**
 * 更新设置
 * @param setting 最新设置数据
 * @returns 更新后的设置数据
 */
handle('publish:updateSetting', (_event, setting) => {
  return updateSetting(setting)
})

/**
 * 发布项目
 *
 * 发布过程各阶段的日志经 publish:publishLog 推给发起发布的渲染进程
 * @param projectType 项目类型
 * @param projectName 项目名称
 * @param targetVersion 目标版本号
 * @returns 发布成功后的最新项目信息
 */
handle('publish:publishProject', async (event, projectType, projectName, targetVersion) => {
  return publishProject(projectType, projectName, targetVersion, (log) => {
    send(event.sender, 'publish:publishLog', { projectType, projectName, ...log })
  })
})

/**
 * 中止发布
 * @param projectType 项目类型
 * @param projectName 项目名称
 * @returns 是否中止成功
 */
handle('publish:abortPublish', (_event, projectType, projectName) => {
  return abortPublish(projectType, projectName)
})
