/**
 * @file 发版 IPC 通道
 * @description 提供项目列表与 Android Studio 配置的增删改查通道
 */
import { handle } from '../utils/handler'
import { publishStore } from '@main/stores/publishStore'

/**
 * 获取项目列表
 * @returns 当前全部项目
 */
handle('release:getProjectList', () => {
  return publishStore.get('localAssets').projects
})

/**
 * 添加项目
 * @param project 项目信息
 * @returns 添加后的项目列表
 */
handle('release:addProject', (_event, project) => {
  if (
    !project ||
    !project.projectName ||
    !project.projectPath ||
    !project.latestVersion ||
    !project.publishController ||
    !project.projectType
  ) {
    throw new Error('添加失败：项目信息不完整')
  }
  const projects = publishStore.get('localAssets').projects
  if (projects.some((item) => item.projectName === project.projectName)) {
    throw new Error(`添加失败：项目「${project.projectName}」已存在`)
  }
  const next = [...projects, project]
  publishStore.set('localAssets.projects', next)
  return next
})

/**
 * 修改项目（按 projectName 定位后整体覆盖）
 * @param project 项目信息
 * @returns 修改后的项目列表
 */
handle('release:updateProject', (_event, project) => {
  if (
    !project ||
    !project.projectName ||
    !project.projectPath ||
    !project.latestVersion ||
    !project.publishController ||
    !project.projectType
  ) {
    throw new Error('修改失败：项目信息不完整')
  }
  const projects = publishStore.get('localAssets').projects
  const index = projects.findIndex((item) => item.projectName === project.projectName)
  if (index === -1) {
    throw new Error(`修改失败：未找到项目「${project.projectName}」`)
  }
  if (projects.some((item, i) => i !== index && item.projectName === project.projectName)) {
    throw new Error(`修改失败：项目「${project.projectName}」已存在`)
  }
  const next = [...projects]
  next[index] = project
  publishStore.set('localAssets.projects', next)
  return next
})

/**
 * 删除项目
 * @param projectName 项目名称
 * @returns 删除后的项目列表
 */
handle('release:deleteProject', (_event, projectName) => {
  const projects = publishStore.get('localAssets').projects
  const index = projects.findIndex((item) => item.projectName === projectName)
  if (index === -1) {
    throw new Error(`删除失败：未找到项目「${projectName}」`)
  }
  const next = [...projects]
  next.splice(index, 1)
  publishStore.set('localAssets.projects', next)
  return next
})

/**
 * 获取 androidStudio 配置
 * @returns 当前 androidStudio 配置
 */
handle('release:getAndroidStudio', () => {
  return publishStore.get('androidStudio')
})

/**
 * 修改 androidStudio 配置
 * @param config androidStudio 配置
 * @returns 保存后的配置
 */
handle('release:updateAndroidStudio', (_event, config) => {
  if (!config || !config.jdkPath || !config.sdkPath) {
    throw new Error('保存失败：androidStudio 配置不完整')
  }
  publishStore.set('androidStudio', config)
  return config
})
